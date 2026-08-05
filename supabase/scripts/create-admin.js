const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Chargeur d'environnement .env.local autonome et sans dépendance externe
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../../.env.local')
  if (!fs.existsSync(envPath)) {
    console.error(`Fichier introuvable : ${envPath}`)
    return
  }
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.substring(0, index).trim()
    let val = trimmed.substring(index + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1)
    }
    process.env[key] = val
  })
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurés dans .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function run() {
  const email = 'marco@athletecv.com'
  const password = 'Tango2018'

  console.log(`Création de l'utilisateur d'authentification pour ${email}...`)

  // 1. Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Marco' }
  })

  if (authError) {
    if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
      console.log(`L'utilisateur auth ${email} existe déjà. Mise à jour de ses privilèges...`)
      // Récupérer l'utilisateur existant
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        console.error('Impossible de lister les utilisateurs:', listError.message)
        process.exit(1)
      }
      const existingUser = usersData.users.find(u => u.email === email)
      if (!existingUser) {
        console.error('Utilisateur introuvable.')
        process.exit(1)
      }
      await updatePrivileges(existingUser.id)
    } else {
      console.error('Erreur Auth:', authError.message)
      process.exit(1)
    }
  } else {
    console.log(`Utilisateur Auth créé avec succès ! ID: ${authData.user.id}`)
    await updatePrivileges(authData.user.id)
  }
}

async function updatePrivileges(userId) {
  console.log(`Attribution des privilèges Administrateur (is_owner, is_super_admin, plan club) sur le profil...`)

  // 2. Mettre à jour le profil public
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_owner: true,
      is_super_admin: true,
      plan: 'club'
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Erreur lors de la mise à jour du profil public:', profileError.message)
    process.exit(1)
  }

  // 3. Mettre à jour la souscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      plan: 'club',
      trial_ends_at: null
    })
    .eq('user_id', userId)

  if (subError) {
    console.error('Erreur lors de la mise à jour de la souscription:', subError.message)
    process.exit(1)
  }

  console.log(`Le compte Admin marco@athletecv.com a été créé et configuré avec succès !`)
}

run()
