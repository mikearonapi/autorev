import styles from './LandingProblem.module.css';

/**
 * @typedef {Object} ProblemItem
 * @property {import('react').ReactNode} icon
 * @property {string} title
 * @property {string} description
 */

/**
 * @param {{ headline: string, items: ProblemItem[] }} props
 */
export default function LandingProblem({ headline, items = [] }) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.headline}>{headline}</h2>
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.title} className={styles.card}>
              <div className={styles.icon}>{item.icon}</div>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


