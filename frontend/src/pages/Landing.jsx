import styles from './Landing.module.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function Landing() {
  const handleConnect = () => {
    window.location.href = `${BACKEND_URL}/login`
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>⚡</div>
        <h1 className={styles.title}>WHOOP Insights</h1>
        <p className={styles.subtitle}>
          Connect your WHOOP account to view your recovery, strain, and sleep trends.
        </p>
        <button className={styles.button} onClick={handleConnect}>
          Connect WHOOP
        </button>
      </div>
    </div>
  )
}
