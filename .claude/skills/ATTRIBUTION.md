# Skills de diseño — fuentes y atribución

Skills de terceros instaladas en este proyecto (`.claude/skills/`). Cada una
conserva su licencia original en su repo fuente. Se copió el `SKILL.md` (y
`references/` de texto) omitiendo assets binarios pesados para no inflar el repo.

| Skill | Fuente | Autor |
|---|---|---|
| `frontend-design` | github.com/anthropics/claude-code · plugins/frontend-design | Anthropic (oficial) |
| `web-design-guidelines` | github.com/vercel-labs/agent-skills · skills/web-design-guidelines | Vercel (oficial) — trae reglas frescas vía WebFetch |
| `emil-design-eng` | github.com/emilkowalski/skills · skills/emil-design-eng | Emil Kowalski |
| `ui-ux-pro-max` | github.com/nextlevelbuilder/ui-ux-pro-max-skill | Comunidad |
| `huashu-design` | github.com/alchaincyf/huashu-design | Comunidad (candidato para "Hush-design" — confirmar) |

Notas:
- `ui-ux-pro-max` y `huashu-design`: se omitió `assets/`, `demos/` y tooling
  pesado (huashu pesaba ~62M). El `SKILL.md` (guía) está completo; funciones
  dependientes de assets (ej. export MP4) requieren instalar el repo completo.
- `frontend-design` (Anthropic) se solapa con el skill `artifact-design` ya
  disponible por plugin.
- Para actualizar cualquiera: re-clonar su repo y re-copiar el `SKILL.md`.
