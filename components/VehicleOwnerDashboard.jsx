'use client';

/**
 * Vehicle Owner Dashboard
 * 
 * Comprehensive owner information panel for vehicles in "My Collection"
 * Displays maintenance specs, service intervals, fluids, tires, and more.
 * 
 * @module components/VehicleOwnerDashboard
 */

import { useState, useEffect } from 'react';
import styles from './VehicleOwnerDashboard.module.css';

// Icons for different categories
const Icons = {
  oil: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v18"/>
      <path d="M18 3v18"/>
      <path d="M6 8h12"/>
      <path d="M6 16h12"/>
      <path d="M12 3v5"/>
    </svg>
  ),
  tire: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  battery: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="18" height="12" rx="2"/>
      <path d="M23 13v-2"/>
      <path d="M11 6v-2"/>
      <path d="M7 6v-2"/>
      <path d="M7 10v4"/>
      <path d="M5 12h4"/>
      <path d="M13 12h4"/>
    </svg>
  ),
  droplet: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  wiper: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4"/>
      <path d="M6.93 4.93l2.83 2.83"/>
      <path d="M2 12h4"/>
      <path d="M17.07 4.93l-2.83 2.83"/>
      <path d="M22 12h-4"/>
      <path d="M12 12l-3 9"/>
      <path d="M12 12l3 9"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4"/>
      <path d="m16.24 7.76 2.83-2.83"/>
      <path d="M20.49 12H22"/>
      <path d="m16.24 16.24 2.83 2.83"/>
      <path d="M12 22v-4"/>
      <path d="m7.76 16.24-2.83 2.83"/>
      <path d="M4 12H2"/>
      <path d="m7.76 7.76-2.83-2.83"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  alert: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  fuel: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/>
      <path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8.5a2 2 0 0 0-.59-1.42l-2.83-2.83a2 2 0 0 0-1.42-.59H17"/>
      <path d="M3 22h12"/>
      <path d="M7 9h4"/>
    </svg>
  ),
  brake: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  sparkPlug: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  wheel: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="5" x2="12" y2="9"/>
      <line x1="12" y1="15" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="9" y2="12"/>
      <line x1="15" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  light: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  copy: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
};

/**
 * Quick Reference Card Component
 */
function QuickRefCard({ icon: Icon, title, items, accentColor = '#c4a564' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayItems = isExpanded ? items : items.slice(0, 3);
  const hasMore = items.length > 3;

  return (
    <div className={styles.quickRefCard}>
      <div className={styles.quickRefHeader}>
        <div className={styles.quickRefIcon} style={{ color: accentColor }}>
          <Icon size={20} />
        </div>
        <h4 className={styles.quickRefTitle}>{title}</h4>
      </div>
      <div className={styles.quickRefItems}>
        {displayItems.map((item, i) => (
          <div key={i} className={styles.quickRefItem}>
            <span className={styles.quickRefLabel}>{item.label}</span>
            <span className={styles.quickRefValue}>{item.value || '—'}</span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button 
          className={styles.quickRefExpand}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>Show less <Icons.chevronUp size={14} /></>
          ) : (
            <>Show {items.length - 3} more <Icons.chevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Copyable Value Component
 */
function CopyableValue({ value, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!value) return <span className={styles.emptyValue}>—</span>;

  return (
    <button className={styles.copyableValue} onClick={handleCopy} title={`Copy ${label}`}>
      <span>{value}</span>
      {copied ? (
        <Icons.check size={14} />
      ) : (
        <Icons.copy size={14} />
      )}
    </button>
  );
}

/**
 * Service Interval Card
 */
function ServiceIntervalCard({ service, currentMileage }) {
  const nextDue = service.interval_miles 
    ? Math.max(0, service.interval_miles - (currentMileage % service.interval_miles))
    : null;
  
  const urgency = nextDue && nextDue < 1000 ? 'urgent' : nextDue && nextDue < 3000 ? 'soon' : 'ok';

  return (
    <div className={`${styles.serviceCard} ${styles[urgency]}`}>
      <div className={styles.serviceHeader}>
        <span className={styles.serviceName}>{service.service_name}</span>
        {urgency === 'urgent' && <span className={styles.urgentBadge}>Due Soon</span>}
      </div>
      <div className={styles.serviceDetails}>
        <span className={styles.serviceInterval}>
          Every {service.interval_miles?.toLocaleString()} mi
          {service.interval_months && ` or ${service.interval_months} months`}
        </span>
        {nextDue && currentMileage > 0 && (
          <span className={styles.serviceNext}>
            ~{nextDue.toLocaleString()} mi remaining
          </span>
        )}
      </div>
      {service.dealer_cost_low && service.dealer_cost_high && (
        <div className={styles.serviceCost}>
          <span>Est. cost: ${service.dealer_cost_low} - ${service.dealer_cost_high}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Known Issue/Recall Card
 */
function KnownIssueCard({ issue }) {
  const severityColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  return (
    <div className={`${styles.issueCard} ${styles[`issue_${issue.severity?.toLowerCase()}`]}`}>
      <div className={styles.issueHeader}>
        <span 
          className={styles.issueSeverity}
          style={{ color: severityColors[issue.severity?.toLowerCase()] || '#888' }}
        >
          <Icons.alert size={16} />
          {issue.issue_type}
        </span>
        {issue.recall_number && (
          <span className={styles.recallNumber}>#{issue.recall_number}</span>
        )}
      </div>
      <h5 className={styles.issueTitle}>{issue.issue_title}</h5>
      {issue.issue_description && (
        <p className={styles.issueDescription}>{issue.issue_description}</p>
      )}
      {issue.symptoms?.length > 0 && (
        <div className={styles.issueSymptoms}>
          <span className={styles.symptomsLabel}>Watch for:</span>
          <ul>
            {issue.symptoms.slice(0, 3).map((symptom, i) => (
              <li key={i}>{symptom}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Main Vehicle Owner Dashboard Component
 */
export default function VehicleOwnerDashboard({ 
  vehicle, 
  car, 
  maintenanceSpecs,
  knownIssues = [],
  serviceIntervals = [],
  onEditVehicle,
}) {
  // Build quick reference data from maintenance specs AND car data as fallback
  const buildQuickRefData = () => {
    const specs = maintenanceSpecs || {};
    
    // Use maintenance specs if available, otherwise fall back to car data where possible
    return {
      oil: {
        icon: Icons.oil,
        title: 'Engine Oil',
        accentColor: '#f59e0b',
        items: [
          { label: 'Type', value: specs.oil_type || 'Full Synthetic (check manual)' },
          { label: 'Viscosity', value: specs.oil_viscosity || '5W-30 or 5W-50' },
          { label: 'Capacity', value: specs.oil_capacity_quarts ? `${specs.oil_capacity_quarts} qt` : '~8-10 qt (check manual)' },
          { label: 'OEM Filter', value: specs.oil_filter_oem_part },
          { label: 'Change Interval', value: specs.oil_change_interval_miles ? `${specs.oil_change_interval_miles.toLocaleString()} mi` : '5,000-7,500 mi' },
        ].filter(item => item.value),
      },
      performance: {
        icon: Icons.gauge,
        title: 'Performance',
        accentColor: '#c4a564',
        items: [
          { label: 'Horsepower', value: car?.hp ? `${car.hp} HP` : null },
          { label: 'Torque', value: car?.torque ? `${car.torque} lb-ft` : null },
          { label: '0-60 mph', value: car?.zeroToSixty ? `${car.zeroToSixty}s` : null },
          { label: 'Top Speed', value: car?.topSpeed ? `${car.topSpeed} mph` : null },
          { label: 'Engine', value: car?.engine },
          { label: 'Transmission', value: car?.trans },
        ].filter(item => item.value),
      },
      fluids: {
        icon: Icons.droplet,
        title: 'Fluids',
        accentColor: '#3b82f6',
        items: [
          { label: 'Coolant Type', value: specs.coolant_type || 'OEM Coolant' },
          { label: 'Brake Fluid', value: specs.brake_fluid_type || 'DOT 4' },
          { label: 'Trans Fluid', value: specs.trans_fluid_manual || specs.trans_fluid_auto },
          { label: 'Diff Fluid', value: specs.diff_fluid_type },
          { label: 'Power Steering', value: specs.power_steering_type },
        ].filter(item => item.value),
      },
      tires: {
        icon: Icons.tire,
        title: 'Tires & Wheels',
        accentColor: '#10b981',
        items: [
          { label: 'Front Tire', value: specs.tire_size_front || '295/35R19 (verify)' },
          { label: 'Rear Tire', value: specs.tire_size_rear || '305/35R19 (verify)' },
          { label: 'Front Pressure', value: specs.tire_pressure_front_psi ? `${specs.tire_pressure_front_psi} PSI` : '35-38 PSI (cold)' },
          { label: 'Rear Pressure', value: specs.tire_pressure_rear_psi ? `${specs.tire_pressure_rear_psi} PSI` : '38-40 PSI (cold)' },
          { label: 'Bolt Pattern', value: specs.wheel_bolt_pattern },
          { label: 'Lug Torque', value: specs.wheel_lug_torque_ft_lbs ? `${specs.wheel_lug_torque_ft_lbs} ft-lbs` : '150 ft-lbs (typical)' },
        ].filter(item => item.value),
      },
      wipers: {
        icon: Icons.wiper,
        title: 'Wipers & Lights',
        accentColor: '#8b5cf6',
        items: [
          { label: 'Driver Wiper', value: specs.wiper_driver_size_inches ? `${specs.wiper_driver_size_inches}"` : '22" (typical)' },
          { label: 'Passenger Wiper', value: specs.wiper_passenger_size_inches ? `${specs.wiper_passenger_size_inches}"` : '20" (typical)' },
          { label: 'Low Beam', value: specs.headlight_low_beam_type || 'LED' },
          { label: 'High Beam', value: specs.headlight_high_beam_type || 'LED' },
          { label: 'Fog Lights', value: specs.headlight_fog_type },
        ].filter(item => item.value),
      },
      battery: {
        icon: Icons.battery,
        title: 'Battery',
        accentColor: '#ec4899',
        items: [
          { label: 'Group Size', value: specs.battery_group_size || 'H6/48 (typical)' },
          { label: 'CCA', value: specs.battery_cca || '750+ CCA' },
          { label: 'Type', value: specs.battery_agm ? 'AGM' : 'AGM Recommended' },
          { label: 'Location', value: specs.battery_location || 'Engine Bay' },
        ].filter(item => item.value),
      },
      fuel: {
        icon: Icons.fuel,
        title: 'Fuel',
        accentColor: '#ef4444',
        items: [
          { label: 'Fuel Type', value: specs.fuel_type || 'Premium Unleaded' },
          { label: 'Min Octane', value: specs.fuel_octane_minimum || 91 },
          { label: 'Recommended', value: specs.fuel_octane_recommended ? `${specs.fuel_octane_recommended} octane` : '93 octane' },
          { label: 'Tank Capacity', value: specs.fuel_tank_capacity_gallons ? `${specs.fuel_tank_capacity_gallons} gal` : '16 gal (typical)' },
        ].filter(item => item.value),
      },
      brakes: {
        icon: Icons.brake,
        title: 'Brakes',
        accentColor: '#f97316',
        items: [
          { label: 'Front Caliper', value: specs.brake_front_caliper_type || 'Brembo 6-piston' },
          { label: 'Rear Caliper', value: specs.brake_rear_caliper_type || 'Brembo 4-piston' },
          { label: 'Fluid Type', value: specs.brake_fluid_type || 'DOT 4' },
          { label: 'Pad Material', value: 'Performance compound' },
        ].filter(item => item.value),
      },
    };
  };

  const quickRefData = buildQuickRefData();
  // Always show quick ref data since we have defaults
  const hasMaintenanceData = true;

  return (
    <div className={styles.dashboard}>
      {/* Quick Reference Cards Grid */}
      <h4 className={styles.sectionTitle}>
        <Icons.wrench size={18} />
        Quick Reference
      </h4>
      <div className={styles.quickRefGrid}>
        {quickRefData.performance?.items.length > 0 && (
          <QuickRefCard {...quickRefData.performance} />
        )}
        {quickRefData.oil?.items.length > 0 && (
          <QuickRefCard {...quickRefData.oil} />
        )}
        {quickRefData.fuel?.items.length > 0 && (
          <QuickRefCard {...quickRefData.fuel} />
        )}
        {quickRefData.tires?.items.length > 0 && (
          <QuickRefCard {...quickRefData.tires} />
        )}
        {quickRefData.fluids?.items.length > 0 && (
          <QuickRefCard {...quickRefData.fluids} />
        )}
        {quickRefData.brakes?.items.length > 0 && (
          <QuickRefCard {...quickRefData.brakes} />
        )}
        {quickRefData.battery?.items.length > 0 && (
          <QuickRefCard {...quickRefData.battery} />
        )}
        {quickRefData.wipers?.items.length > 0 && (
          <QuickRefCard {...quickRefData.wipers} />
        )}
      </div>

      {/* Note about data source */}
      {!maintenanceSpecs && (
        <div className={styles.dataSourceNote}>
          <Icons.info size={14} />
          <span>Some values are estimates. Verify with your owner's manual or VIN lookup.</span>
        </div>
      )}

      {/* Service Intervals */}
      {serviceIntervals.length > 0 && (
        <>
          <h4 className={styles.sectionTitle}>
            <Icons.wrench size={18} />
            Service Schedule
          </h4>
          <div className={styles.serviceGrid}>
            {serviceIntervals.slice(0, 6).map((service, i) => (
              <ServiceIntervalCard 
                key={i} 
                service={service} 
                currentMileage={vehicle?.mileage || 0}
              />
            ))}
          </div>
        </>
      )}

      {/* Known Issues / Recalls */}
      {knownIssues.length > 0 && (
        <>
          <h4 className={styles.sectionTitle}>
            <Icons.alert size={18} />
            Known Issues & Recalls
          </h4>
          <div className={styles.issuesGrid}>
            {knownIssues.slice(0, 4).map((issue, i) => (
              <KnownIssueCard key={i} issue={issue} />
            ))}
          </div>
        </>
      )}

      {/* Ownership Details */}
      {(vehicle?.purchaseDate || vehicle?.purchasePrice || vehicle?.color) && (
        <>
          <h4 className={styles.sectionTitle}>
            <Icons.info size={18} />
            Ownership Details
          </h4>
          <div className={styles.ownershipGrid}>
            {vehicle?.purchaseDate && (
              <div className={styles.ownershipItem}>
                <span className={styles.ownershipLabel}>Purchase Date</span>
                <span className={styles.ownershipValue}>
                  {new Date(vehicle.purchaseDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {vehicle?.purchasePrice && (
              <div className={styles.ownershipItem}>
                <span className={styles.ownershipLabel}>Purchase Price</span>
                <span className={styles.ownershipValue}>
                  ${vehicle.purchasePrice.toLocaleString()}
                </span>
              </div>
            )}
            {vehicle?.color && (
              <div className={styles.ownershipItem}>
                <span className={styles.ownershipLabel}>Color</span>
                <span className={styles.ownershipValue}>{vehicle.color}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Notes */}
      {vehicle?.notes && (
        <div className={styles.notesSection}>
          <h4 className={styles.sectionTitle}>
            <Icons.info size={18} />
            Notes
          </h4>
          <p className={styles.notesText}>{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}
