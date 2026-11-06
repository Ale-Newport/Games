import { href } from '../router';
import { useT } from '../platform';

export function NotFoundPage() {
  const t = useT();
  return (
    <div className="page">
      <h1 className="page-title">{t('notFound.title')}</h1>
      <p className="page-subtitle">{t('notFound.body')}</p>
      <a className="btn btn-primary" href={href('/')}>
        {t('nav.home')}
      </a>
    </div>
  );
}
