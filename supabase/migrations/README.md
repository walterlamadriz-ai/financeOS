# Migraciones versionadas — desde 2026-08-27

Antes de este directorio, cada cambio a la base (Supabase) vivía como un
archivo suelto en la raíz del repo (`supabase-*.sql`), pegado a mano en el
SQL Editor del Dashboard. Eso ya causó dos incidentes reales documentados en
`financeos-app/CLAUDE.md`: producción parcheada a mano sin actualizar el
archivo del repo (`supabase-license-email.sql`, 2026-08-22) y un archivo que
quedó con un bug ya corregido en su hermano (`supabase-push.sql`, mismo bug
de doble-hash que `supabase-sync.sql` ya había arreglado — encontrado en la
auditoría del 2026-08-27, verificado con `pg_get_functiondef` que producción
ya estaba bien y solo el archivo del repo estaba viejo).

**Los 7 archivos `supabase-*.sql` de la raíz siguen siendo la fuente de
verdad del estado histórico** — no se tocaron ni se movieron acá, y las
referencias a ellos en `CLAUDE.md` y en el propio código siguen siendo
correctas.

**A partir de ahora, cualquier cambio NUEVO a la base va como una migración
acá, no como otro archivo suelto en la raíz:**

```bash
supabase migration new nombre_descriptivo
# escribir el SQL en el archivo que genera (supabase/migrations/<timestamp>_nombre_descriptivo.sql)
supabase db push --linked --project-ref nelwgbcddwiaimzbcuas
```

Esto dos cosas que el patrón anterior no daba:
1. **Verificable**: `supabase db push` compara contra lo que ya está aplicado en producción — ya no se puede "pisar" una función buena con una vieja sin que el CLI lo note.
2. **Auditable**: cada cambio queda con fecha y nombre en el historial de git, no mezclado dentro de un archivo que ya tenía otro propósito.

Antes de escribir una migración nueva sobre `licenses`, `push_subscriptions`
o `synced_data`, seguir verificando contra producción real primero
(`supabase db query --linked --project-ref nelwgbcddwiaimzbcuas "select pg_get_functiondef(oid) from pg_proc where proname='...'"`)
— la disciplina de "no asumir que el repo refleja lo que corre" sigue
aplicando igual con migraciones versionadas.
