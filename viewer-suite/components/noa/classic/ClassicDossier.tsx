import type { NoaProfile } from '@/types/noa'

interface Props {
  profile: NoaProfile
}

/**
 * Dossier complet de Noa — sections académiques et professionnelles,
 * rendues avec les mêmes primitives visuelles que ProfileView
 * (p-block, p-timeline, p-trophy, p-stat).
 */
export function ClassicDossier({ profile }: Props) {
  const { identity, classic } = profile

  return (
    <>
      <section className="p-block">
        <h2 className="p-block-title">Coordonnées</h2>
        <div className="p-palmares">
          {identity.contact.map((c) => (
            <div key={c.label} className="p-trophy reveal">
              <span className="ti">{c.icon}</span>
              <span className="tn">{c.label}</span>
              {c.href ? (
                <a className="tc" href={c.href} style={{ textDecoration: 'none' }}>
                  {c.value}
                </a>
              ) : (
                <span className="tc">{c.value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="p-block">
        <h2 className="p-block-title">Formation académique</h2>
        <div className="p-timeline">
          {classic.education.map((e) => (
            <div key={e.qualification} className="p-event reveal">
              <div className="y">{e.year}</div>
              <div className="t">{e.qualification}</div>
              <div className="d">
                {e.institution} — {e.location}
                {e.result && ` • ${e.result}`}
              </div>
              {e.notes && <div className="d">{e.notes}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="p-block">
        <h2 className="p-block-title">Expériences professionnelles</h2>
        <div className="p-timeline">
          {classic.experience.map((x) => (
            <div key={x.title} className="p-event reveal">
              <div className="y">{x.period}</div>
              <div className="t">{x.title}</div>
              <div className="d">
                {x.organization} — {x.location}
              </div>
              <div className="d">{x.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="p-block">
        <h2 className="p-block-title">Langues</h2>
        <div className="p-palmares">
          {classic.languages.map((l) => (
            <div key={l.language} className="p-trophy reveal">
              <span className="ti">🗣️</span>
              <span className="tn">{l.language}</span>
              <span className="tc">{l.proficiency}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="p-block">
        <h2 className="p-block-title">Références</h2>
        <div className="p-palmares">
          {classic.references.map((r) => (
            <div key={r.name} className="p-trophy reveal">
              <span className="ti">📞</span>
              <span className="tn">
                {r.name}
                <span style={{ display: 'block', fontWeight: 300, fontSize: '0.84rem', color: 'var(--muted)' }}>
                  {r.role}
                  {r.organization && ` — ${r.organization}`}
                </span>
              </span>
              <a className="tc" href={`tel:${r.phone.replace(/[^+\d]/g, '')}`} style={{ textDecoration: 'none' }}>
                {r.phone}
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
