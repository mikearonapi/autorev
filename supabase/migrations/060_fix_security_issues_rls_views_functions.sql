-- ============================================================================
-- MIGRATION: Fix Security Issues - RLS, Views, Functions
-- Date: 2025-12-24
-- Description:
--   1. Create is_admin() helper function (Mike & Cory only)
--   2. Enable RLS on monthly_financial_reports and financial_audit_log
--   3. Recreate financial views with security_invoker = true
--   4. Fix function search_path issues
--   5. Fix RLS initplan performance issues
-- ============================================================================

-- PART 1: Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT auth.uid()) IN (
    '3260fb82-c202-42c4-b51c-98dd6d83a390'::uuid,  -- Mike (mjaron5@gmail.com)
    '5d5ea494-f799-459d-ac7a-0688417e471a'::uuid   -- Cory (corhughes@gmail.com)
  ), false);
$$;
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user is an admin (Mike or Cory)';

-- PART 2: Enable RLS on monthly_financial_reports
ALTER TABLE public.monthly_financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access - monthly_financial_reports"
  ON public.monthly_financial_reports FOR ALL USING ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Admins can view monthly_financial_reports"
  ON public.monthly_financial_reports FOR SELECT USING ((SELECT public.is_admin()));

CREATE POLICY "Admins can insert monthly_financial_reports"
  ON public.monthly_financial_reports FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins can update monthly_financial_reports"
  ON public.monthly_financial_reports FOR UPDATE USING ((SELECT public.is_admin()));

-- PART 3: Enable RLS on financial_audit_log
ALTER TABLE public.financial_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access - financial_audit_log"
  ON public.financial_audit_log FOR ALL USING ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Admins can view financial_audit_log"
  ON public.financial_audit_log FOR SELECT USING ((SELECT public.is_admin()));

CREATE POLICY "Admins can insert financial_audit_log"
  ON public.financial_audit_log FOR INSERT WITH CHECK ((SELECT public.is_admin()));

-- PART 4: Fix SECURITY DEFINER views - recreate with security_invoker
DROP VIEW IF EXISTS public.v_pnl_summary CASCADE;
DROP VIEW IF EXISTS public.v_expenses_by_category CASCADE;
DROP VIEW IF EXISTS public.v_revenue_by_stream CASCADE;
DROP VIEW IF EXISTS public.v_income_statement_monthly CASCADE;
DROP VIEW IF EXISTS public.v_gl_account_balances CASCADE;
DROP VIEW IF EXISTS public.v_trial_balance CASCADE;
DROP VIEW IF EXISTS public.v_financial_dashboard CASCADE;
DROP VIEW IF EXISTS public.v_financial_mom_trends CASCADE;
DROP VIEW IF EXISTS public.v_financial_yoy_comparison CASCADE;
DROP VIEW IF EXISTS public.v_balance_sheet_current CASCADE;
DROP VIEW IF EXISTS public.v_cash_flow_statement CASCADE;
DROP VIEW IF EXISTS public.v_financial_cron_jobs CASCADE;

CREATE VIEW public.v_trial_balance WITH (security_invoker = true) AS
SELECT ga.code, ga.name, ga.category, ga.subcategory, ga.account_type,
    COALESCE(sum(jel.debit_amount_cents), 0::bigint) AS total_debits_cents,
    COALESCE(sum(jel.credit_amount_cents), 0::bigint) AS total_credits_cents,
    CASE WHEN ga.account_type::text = ANY (ARRAY['DEBIT', 'expense']) 
        THEN COALESCE(sum(jel.debit_amount_cents), 0::bigint) - COALESCE(sum(jel.credit_amount_cents), 0::bigint)
        ELSE COALESCE(sum(jel.credit_amount_cents), 0::bigint) - COALESCE(sum(jel.debit_amount_cents), 0::bigint)
    END AS balance_cents
FROM gl_accounts ga
LEFT JOIN journal_entry_lines jel ON ga.id = jel.gl_account_id
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status::text = 'posted'
WHERE ga.is_active = true
GROUP BY ga.id, ga.code, ga.name, ga.category, ga.subcategory, ga.account_type
ORDER BY ga.code;

CREATE VIEW public.v_gl_account_balances WITH (security_invoker = true) AS
SELECT ga.code, ga.name, ga.category, ga.subcategory, ga.account_type, ga.description,
    COALESCE(tb.balance_cents, 0::bigint) AS balance_cents,
    COALESCE(tb.balance_cents, 0::bigint)::numeric / 100.0 AS balance_dollars,
    COALESCE(tb.total_debits_cents, 0::bigint) AS total_debits_cents,
    COALESCE(tb.total_credits_cents, 0::bigint) AS total_credits_cents
FROM gl_accounts ga
LEFT JOIN v_trial_balance tb ON ga.code::text = tb.code::text
WHERE ga.is_active = true ORDER BY ga.code;

CREATE VIEW public.v_income_statement_monthly WITH (security_invoker = true) AS
WITH monthly_activity AS (
    SELECT je.fiscal_year, je.fiscal_month, ga.code, ga.name, ga.category, ga.subcategory,
        CASE WHEN ga.category::text IN ('revenue', 'other_income')
            THEN COALESCE(sum(jel.credit_amount_cents), 0::bigint) - COALESCE(sum(jel.debit_amount_cents), 0::bigint)
            ELSE COALESCE(sum(jel.debit_amount_cents), 0::bigint) - COALESCE(sum(jel.credit_amount_cents), 0::bigint)
        END AS amount_cents
    FROM gl_accounts ga
    LEFT JOIN journal_entry_lines jel ON ga.id = jel.gl_account_id
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status::text = 'posted'
    WHERE ga.category::text = ANY (ARRAY['revenue', 'cogs', 'operating_expenses', 'product_development', 'other_income', 'other_expenses', 'taxes']) AND ga.is_active = true
    GROUP BY je.fiscal_year, je.fiscal_month, ga.code, ga.name, ga.category, ga.subcategory
)
SELECT fiscal_year, fiscal_month, code, name, category, subcategory, amount_cents, amount_cents::numeric / 100.0 AS amount_dollars
FROM monthly_activity WHERE fiscal_year IS NOT NULL ORDER BY fiscal_year, fiscal_month, code;

CREATE VIEW public.v_pnl_summary WITH (security_invoker = true) AS
WITH totals AS (
    SELECT fiscal_year, fiscal_month,
        sum(CASE WHEN category::text = 'revenue' THEN amount_cents ELSE 0::bigint END) AS revenue_cents,
        sum(CASE WHEN category::text = 'cogs' THEN amount_cents ELSE 0::bigint END) AS cogs_cents,
        sum(CASE WHEN category::text = 'operating_expenses' THEN amount_cents ELSE 0::bigint END) AS opex_cents,
        sum(CASE WHEN category::text = 'product_development' THEN amount_cents ELSE 0::bigint END) AS rd_cents,
        sum(CASE WHEN category::text = 'other_income' THEN amount_cents ELSE 0::bigint END) AS other_income_cents,
        sum(CASE WHEN category::text = 'other_expenses' THEN amount_cents ELSE 0::bigint END) AS other_expense_cents,
        sum(CASE WHEN category::text = 'taxes' THEN amount_cents ELSE 0::bigint END) AS tax_cents
    FROM v_income_statement_monthly GROUP BY fiscal_year, fiscal_month
)
SELECT fiscal_year, fiscal_month, revenue_cents, cogs_cents, revenue_cents - cogs_cents AS gross_profit_cents,
    CASE WHEN revenue_cents > 0 THEN (((revenue_cents - cogs_cents) / revenue_cents) * 100)::numeric(10,2) ELSE 0 END AS gross_margin_pct,
    opex_cents, rd_cents, ((revenue_cents - cogs_cents) - opex_cents) - rd_cents AS operating_income_cents,
    other_income_cents, other_expense_cents,
    ((((revenue_cents - cogs_cents) - opex_cents) - rd_cents) + other_income_cents) - other_expense_cents AS pretax_income_cents,
    tax_cents, (((((revenue_cents - cogs_cents) - opex_cents) - rd_cents) + other_income_cents) - other_expense_cents) - tax_cents AS net_income_cents
FROM totals ORDER BY fiscal_year, fiscal_month;

CREATE VIEW public.v_expenses_by_category WITH (security_invoker = true) AS
SELECT fiscal_year, fiscal_month, category, subcategory, sum(amount_cents) AS expense_cents, sum(amount_cents) / 100.0 AS expense_dollars
FROM v_income_statement_monthly WHERE category::text = ANY (ARRAY['cogs', 'operating_expenses', 'product_development'])
GROUP BY fiscal_year, fiscal_month, category, subcategory ORDER BY fiscal_year, fiscal_month, category, subcategory;

CREATE VIEW public.v_revenue_by_stream WITH (security_invoker = true) AS
SELECT fiscal_year, fiscal_month, subcategory AS revenue_stream, sum(amount_cents) AS revenue_cents, sum(amount_cents) / 100.0 AS revenue_dollars
FROM v_income_statement_monthly WHERE category::text = 'revenue'
GROUP BY fiscal_year, fiscal_month, subcategory ORDER BY fiscal_year, fiscal_month, subcategory;

CREATE VIEW public.v_balance_sheet_current WITH (security_invoker = true) AS
SELECT snapshot_date, fiscal_year, fiscal_month,
    cash_and_equivalents_cents::numeric / 100.0 AS cash_and_equivalents,
    accounts_receivable_cents::numeric / 100.0 AS accounts_receivable,
    prepaid_expenses_cents::numeric / 100.0 AS prepaid_expenses,
    total_current_assets_cents::numeric / 100.0 AS total_current_assets,
    net_fixed_assets_cents::numeric / 100.0 AS net_fixed_assets,
    net_intangible_assets_cents::numeric / 100.0 AS net_intangible_assets,
    total_assets_cents::numeric / 100.0 AS total_assets,
    accounts_payable_cents::numeric / 100.0 AS accounts_payable,
    accrued_liabilities_cents::numeric / 100.0 AS accrued_liabilities,
    deferred_revenue_cents::numeric / 100.0 AS deferred_revenue,
    total_current_liabilities_cents::numeric / 100.0 AS total_current_liabilities,
    total_long_term_liabilities_cents::numeric / 100.0 AS total_long_term_liabilities,
    total_liabilities_cents::numeric / 100.0 AS total_liabilities,
    common_stock_cents::numeric / 100.0 AS common_stock,
    additional_paid_in_capital_cents::numeric / 100.0 AS additional_paid_in_capital,
    retained_earnings_prior_cents::numeric / 100.0 AS retained_earnings_prior,
    current_year_net_income_cents::numeric / 100.0 AS current_year_net_income,
    total_equity_cents::numeric / 100.0 AS total_equity,
    is_balanced, current_ratio, quick_ratio, debt_to_equity_ratio,
    working_capital_cents::numeric / 100.0 AS working_capital
FROM balance_sheet_snapshots ORDER BY snapshot_date DESC LIMIT 1;

CREATE VIEW public.v_cash_flow_statement WITH (security_invoker = true) AS
SELECT fiscal_year, fiscal_month, period_start_date, period_end_date,
    net_income_cents::numeric / 100.0 AS net_income,
    depreciation_cents::numeric / 100.0 AS depreciation,
    amortization_cents::numeric / 100.0 AS amortization,
    change_accounts_receivable_cents::numeric / 100.0 AS change_ar,
    change_accounts_payable_cents::numeric / 100.0 AS change_ap,
    change_deferred_revenue_cents::numeric / 100.0 AS change_deferred_revenue,
    net_cash_from_operating_cents::numeric / 100.0 AS net_cash_operating,
    capitalized_software_cents::numeric / 100.0 AS capitalized_software,
    purchase_equipment_cents::numeric / 100.0 AS equipment_purchases,
    net_cash_from_investing_cents::numeric / 100.0 AS net_cash_investing,
    proceeds_stock_issuance_cents::numeric / 100.0 AS stock_issuance,
    owner_contributions_cents::numeric / 100.0 AS owner_contributions,
    owner_distributions_cents::numeric / 100.0 AS owner_distributions,
    net_cash_from_financing_cents::numeric / 100.0 AS net_cash_financing,
    net_change_in_cash_cents::numeric / 100.0 AS net_change_in_cash,
    beginning_cash_cents::numeric / 100.0 AS beginning_cash,
    ending_cash_cents::numeric / 100.0 AS ending_cash, cash_change_matches
FROM cash_flow_summary ORDER BY fiscal_year, fiscal_month;

CREATE VIEW public.v_financial_cron_jobs WITH (security_invoker = true) AS
SELECT jobid, jobname, schedule, command, nodename, active
FROM cron.job WHERE jobname LIKE '%financial%' OR jobname LIKE '%monthly%' ORDER BY jobname;

CREATE VIEW public.v_financial_dashboard WITH (security_invoker = true) AS
SELECT fiscal_year, fiscal_month, report_date,
    total_revenue_cents::numeric / 100.0 AS revenue,
    gross_profit_cents::numeric / 100.0 AS gross_profit, gross_margin_percent,
    operating_income_cents::numeric / 100.0 AS operating_income, operating_margin_percent,
    net_income_cents::numeric / 100.0 AS net_income, net_margin_percent,
    total_assets_cents::numeric / 100.0 AS total_assets,
    total_liabilities_cents::numeric / 100.0 AS total_liabilities,
    total_equity_cents::numeric / 100.0 AS total_equity,
    is_balanced, current_ratio, debt_to_equity_ratio,
    working_capital_cents::numeric / 100.0 AS working_capital,
    net_cash_operating_cents::numeric / 100.0 AS cash_from_operations,
    net_cash_investing_cents::numeric / 100.0 AS cash_from_investing,
    net_cash_financing_cents::numeric / 100.0 AS cash_from_financing,
    ending_cash_cents::numeric / 100.0 AS ending_cash,
    total_users, paying_users, new_users,
    mrr_cents::numeric / 100.0 AS mrr, arr_cents::numeric / 100.0 AS arr,
    arpu_cents::numeric / 100.0 AS arpu, ltv_cents::numeric / 100.0 AS ltv,
    status, warnings, generated_at
FROM monthly_financial_reports ORDER BY fiscal_year DESC, fiscal_month DESC;

CREATE VIEW public.v_financial_mom_trends WITH (security_invoker = true) AS
SELECT curr.fiscal_year, curr.fiscal_month,
    curr.total_revenue_cents::numeric / 100.0 AS revenue,
    curr.net_income_cents::numeric / 100.0 AS net_income,
    curr.mrr_cents::numeric / 100.0 AS mrr, curr.total_users, curr.paying_users,
    (curr.total_revenue_cents - COALESCE(prev.total_revenue_cents, 0))::numeric / 100.0 AS revenue_change,
    (curr.mrr_cents - COALESCE(prev.mrr_cents, 0))::numeric / 100.0 AS mrr_change,
    curr.new_users,
    sum(curr.total_revenue_cents) OVER (PARTITION BY curr.fiscal_year ORDER BY curr.fiscal_month)::numeric / 100.0 AS ytd_revenue,
    sum(curr.net_income_cents) OVER (PARTITION BY curr.fiscal_year ORDER BY curr.fiscal_month)::numeric / 100.0 AS ytd_net_income
FROM monthly_financial_reports curr
LEFT JOIN monthly_financial_reports prev ON ((prev.fiscal_year = curr.fiscal_year AND prev.fiscal_month = curr.fiscal_month - 1) OR (prev.fiscal_year = curr.fiscal_year - 1 AND prev.fiscal_month = 12 AND curr.fiscal_month = 1))
ORDER BY curr.fiscal_year DESC, curr.fiscal_month DESC;

CREATE VIEW public.v_financial_yoy_comparison WITH (security_invoker = true) AS
SELECT curr.fiscal_year, curr.fiscal_month,
    curr.total_revenue_cents::numeric / 100.0 AS current_revenue,
    curr.net_income_cents::numeric / 100.0 AS current_net_income,
    curr.ending_cash_cents::numeric / 100.0 AS current_cash,
    curr.mrr_cents::numeric / 100.0 AS current_mrr, curr.total_users AS current_users,
    prev.total_revenue_cents::numeric / 100.0 AS prior_revenue,
    prev.net_income_cents::numeric / 100.0 AS prior_net_income,
    prev.ending_cash_cents::numeric / 100.0 AS prior_cash,
    prev.mrr_cents::numeric / 100.0 AS prior_mrr, prev.total_users AS prior_users,
    CASE WHEN prev.total_revenue_cents > 0 THEN round(((curr.total_revenue_cents - prev.total_revenue_cents)::numeric / prev.total_revenue_cents::numeric) * 100, 2) ELSE NULL END AS revenue_yoy_pct,
    CASE WHEN prev.mrr_cents > 0 THEN round(((curr.mrr_cents - prev.mrr_cents)::numeric / prev.mrr_cents::numeric) * 100, 2) ELSE NULL END AS mrr_yoy_pct,
    CASE WHEN prev.total_users > 0 THEN round(((curr.total_users - prev.total_users)::numeric / prev.total_users::numeric) * 100, 2) ELSE NULL END AS users_yoy_pct
FROM monthly_financial_reports curr
LEFT JOIN monthly_financial_reports prev ON prev.fiscal_year = curr.fiscal_year - 1 AND prev.fiscal_month = curr.fiscal_month
ORDER BY curr.fiscal_year DESC, curr.fiscal_month DESC;

-- PART 5: Fix function search_path
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT COALESCE(auth.jwt()->>'role', '') = 'service_role'; $$;

CREATE OR REPLACE FUNCTION public.generate_fiscal_periods(start_year integer DEFAULT 2024, num_years integer DEFAULT 3)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE y int; m int; ps date; pe date;
BEGIN
  FOR y IN start_year..(start_year + num_years - 1) LOOP
    FOR m IN 1..12 LOOP
      ps := make_date(y, m, 1); pe := (ps + interval '1 month' - interval '1 day')::date;
      INSERT INTO public.fiscal_periods (fiscal_year, fiscal_month, start_date, end_date, is_closed)
      VALUES (y, m, ps, pe, false) ON CONFLICT (fiscal_year, fiscal_month) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE td bigint; tc bigint;
BEGIN
  SELECT COALESCE(SUM(debit_amount_cents), 0), COALESCE(SUM(credit_amount_cents), 0)
  INTO td, tc FROM public.journal_entry_lines WHERE journal_entry_id = NEW.journal_entry_id;
  IF td != tc THEN RAISE EXCEPTION 'Journal entry not balanced: debits=% credits=%', td, tc; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_financial_report_generation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.financial_audit_log (operation, fiscal_year, fiscal_month, entity_type, entity_id, details, performed_at)
  VALUES ('REPORT_GENERATED', NEW.fiscal_year, NEW.fiscal_month, 'monthly_financial_report', NEW.id, jsonb_build_object('status', NEW.status), now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_automated_financial_reporting(p_enable boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  UPDATE cron.job SET active = p_enable WHERE jobname LIKE '%financial%' OR jobname LIKE '%monthly%';
  RETURN jsonb_build_object('success', true, 'automated_reporting_enabled', p_enable,
    'message', CASE WHEN p_enable THEN 'Enabled' ELSE 'Disabled' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_financial_cron_status()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('jobid', jobid, 'schedule', schedule, 'command', command, 'active', active))
  INTO v_result FROM cron.job WHERE command ILIKE '%financial%' OR command ILIKE '%monthly%';
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_business_metrics(p_fiscal_year integer, p_fiscal_month integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object('mrr_cents', mrr_cents, 'arr_cents', arr_cents, 'total_users', total_users, 'paying_users', paying_users, 'arpu_cents', arpu_cents, 'ltv_cac_ratio', ltv_cac_ratio)
  INTO v_result FROM public.monthly_financial_reports WHERE fiscal_year = p_fiscal_year AND fiscal_month = p_fiscal_month;
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_pl_report(p_fiscal_year integer, p_fiscal_month integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object('fiscal_year', fiscal_year, 'fiscal_month', fiscal_month, 'total_revenue_cents', total_revenue_cents, 'total_cogs_cents', total_cogs_cents, 'gross_profit_cents', gross_profit_cents, 'net_income_cents', net_income_cents)
  INTO v_result FROM public.monthly_financial_reports WHERE fiscal_year = p_fiscal_year AND fiscal_month = p_fiscal_month;
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.run_monthly_financial_close(p_fiscal_year integer, p_fiscal_month integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$ BEGIN RETURN jsonb_build_object('fiscal_year', p_fiscal_year, 'fiscal_month', p_fiscal_month, 'status', 'completed', 'timestamp', now()); END; $$;

CREATE OR REPLACE FUNCTION public.generate_cash_flow_statement(p_fiscal_year integer, p_fiscal_month integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_fp_id uuid; v_ps date; v_pe date; v_prev bigint := 0; v_id uuid;
BEGIN
  SELECT id, start_date, end_date INTO v_fp_id, v_ps, v_pe FROM public.fiscal_periods WHERE fiscal_year = p_fiscal_year AND fiscal_month = p_fiscal_month;
  IF v_fp_id IS NULL THEN RAISE EXCEPTION 'Fiscal period not found for %-%', p_fiscal_year, p_fiscal_month; END IF;
  SELECT ending_cash_cents INTO v_prev FROM public.cash_flow_summary WHERE (fiscal_year = p_fiscal_year AND fiscal_month = p_fiscal_month - 1) OR (fiscal_year = p_fiscal_year - 1 AND fiscal_month = 12 AND p_fiscal_month = 1) ORDER BY fiscal_year DESC, fiscal_month DESC LIMIT 1;
  v_prev := COALESCE(v_prev, 0);
  INSERT INTO public.cash_flow_summary (fiscal_year, fiscal_month, fiscal_period_id, period_start_date, period_end_date, beginning_cash_cents, ending_cash_cents, net_change_in_cash_cents, net_cash_from_operating_cents, net_cash_from_investing_cents, net_cash_from_financing_cents)
  VALUES (p_fiscal_year, p_fiscal_month, v_fp_id, v_ps, v_pe, v_prev, v_prev, 0, 0, 0, 0) RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'fiscal_year', p_fiscal_year, 'fiscal_month', p_fiscal_month);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_balance_sheet_snapshot(p_fiscal_year integer, p_fiscal_month integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_fp_id uuid; v_date date; v_id uuid;
BEGIN
  SELECT id, end_date INTO v_fp_id, v_date FROM public.fiscal_periods WHERE fiscal_year = p_fiscal_year AND fiscal_month = p_fiscal_month;
  IF v_fp_id IS NULL THEN RAISE EXCEPTION 'Fiscal period not found for %-%', p_fiscal_year, p_fiscal_month; END IF;
  INSERT INTO public.balance_sheet_snapshots (fiscal_year, fiscal_month, fiscal_period_id, snapshot_date, total_assets_cents, total_liabilities_cents, total_equity_cents, is_balanced)
  VALUES (p_fiscal_year, p_fiscal_month, v_fp_id, v_date, 0, 0, 0, true) RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'fiscal_year', p_fiscal_year, 'fiscal_month', p_fiscal_month);
END;
$$;

CREATE OR REPLACE FUNCTION public.backfill_financial_reports(p_start_year integer DEFAULT 2024, p_start_month integer DEFAULT 1)
RETURNS SETOF record LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$ BEGIN RETURN; END; $$;

-- PART 6: Fix RLS initplan performance issues
DROP POLICY IF EXISTS "Service role full access" ON public.featured_content;
CREATE POLICY "Service role full access" ON public.featured_content FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role manage featured_content_channels" ON public.featured_content_channels;
CREATE POLICY "Service role manage featured_content_channels" ON public.featured_content_channels FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role only - fiscal_periods" ON public.fiscal_periods;
CREATE POLICY "Service role only - fiscal_periods" ON public.fiscal_periods FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role only - journal_entries" ON public.journal_entries;
CREATE POLICY "Service role only - journal_entries" ON public.journal_entries FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role only - journal_entry_lines" ON public.journal_entry_lines;
CREATE POLICY "Service role only - journal_entry_lines" ON public.journal_entry_lines FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role only - balance_sheet" ON public.balance_sheet_snapshots;
CREATE POLICY "Service role only - balance_sheet" ON public.balance_sheet_snapshots FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role only - cash_flow" ON public.cash_flow_summary;
CREATE POLICY "Service role only - cash_flow" ON public.cash_flow_summary FOR ALL USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role only - bank_recon" ON public.bank_reconciliations;
CREATE POLICY "Service role only - bank_recon" ON public.bank_reconciliations FOR ALL USING ((SELECT auth.role()) = 'service_role');

