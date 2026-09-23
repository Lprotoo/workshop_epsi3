import { useLanguage } from '../../i18n/LanguageContext'
import TrendChart from '../Dashboard/TrendChart'

export default function HistoryChart({ data, range }) {
  const { t } = useLanguage()
  return <TrendChart data={data} title={t('history.trend', { days: range })} />
}
