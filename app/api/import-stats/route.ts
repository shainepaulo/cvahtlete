import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: 'L\'URL est requise.' }, { status: 400 })
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cookie': 'consent=true; euconsent-v2=true; cookieconsent=true; contentpass=true; _cmpconsent=true; consent-manager=true; optin=true'
    }

    if (url.includes('lnh.fr')) {
      // --- SCRAPER LNH ---
      const response = await fetch(url, { headers })
      if (!response.ok) {
        return NextResponse.json({ error: `Impossible de charger la page LNH (${response.status})` }, { status: 500 })
      }
      const html = await response.text()
      const $ = cheerio.load(html)

      const name = $('div.col-infos h2').text().trim()
      if (!name) {
        return NextResponse.json({ error: 'Impossible de lire les informations du joueur sur cette page LNH.' }, { status: 400 })
      }

      const parts = name.split(/\s+/)
      const first = parts[0] || ''
      const last = parts.slice(1).join(' ') || ''
      const discipline = $('.position').text().trim()
      const avatarRaw = $('.picture img').attr('src')
      const avatar = avatarRaw && !avatarRaw.includes('silhouette.png') 
        ? new URL(avatarRaw, 'https://www.lnh.fr').toString() 
        : ''
      
      let nationality = ''
      let dob = ''
      let height = ''
      let weight = ''
      let currentClub = ''

      $('.row-infos').each((_, el) => {
        const label = $(el).find('.col-label').text().trim().toLowerCase()
        const value = $(el).find('.col-value').text().trim()
        if (label.includes('nationalit')) nationality = value
        else if (label.includes('né le') || label.includes('ne le')) dob = value
        else if (label.includes('taille')) height = value
        else if (label.includes('poids')) weight = value
        else if (label.includes('club actuel')) currentClub = value
      })

      // Récupérer les paramètres AJAX pour les stats
      const players_id = $('input[name="players_id"]').val() as string
      const key = $('input[name="key"]').val() as string
      const default_univers = $('input[name="default_univers"]').val() as string
      const urlVal = $('input[name="url"]').val() as string
      const cache = $('input[name="cache"]').val() as string
      const cacheKeys = $('input[name="cacheKeys"]').val() as string

      const stats: Array<{ label: string; value: string; unit: string }> = []
      const career: Array<{ year: string; club: string; detail: string }> = []

      // Ajouter les caractéristiques physiques aux statistiques
      if (height) {
        stats.push({ label: 'Taille', value: height.replace(/[^\d]/g, ''), unit: 'cm' })
      }
      if (weight) {
        stats.push({ label: 'Poids', value: weight.replace(/[^\d]/g, ''), unit: 'kg' })
      }
      if (dob) {
        stats.push({ label: 'Naissance', value: dob, unit: '' })
      }

      if (players_id && key) {
        const body = new URLSearchParams({
          players_id,
          key,
          default_univers,
          url: urlVal,
          cache,
          cacheKeys,
          contents_controller: 'sportsPlayers',
          contents_action: 'view_tab_carrer',
          action: 'view_tab_carrer'
        })

        const ajaxResponse = await fetch('https://www.lnh.fr/ajaxpost1', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        })

        if (ajaxResponse.ok) {
          const ajaxHtml = await ajaxResponse.text()
          const $ajax = cheerio.load(ajaxHtml)

          $ajax('table.table-stats tbody tr').each((_, tr) => {
            const cells = $ajax(tr).find('td').map((_, td) => $ajax(td).text().trim().replace(/\s+/g, ' ')).get()
            if (cells.length >= 7) {
              const season = cells[0]
              const club = cells[1]
              const matches = cells[2]
              const goals = cells[5]
              const efficiency = cells[6]

              if (club && !club.includes('TOTAL') && !season.includes('saison')) {
                career.push({
                  year: season,
                  club: club,
                  detail: `${matches} (${goals} buts, ${efficiency} eff.)`
                })
              }

              if (club === 'TOTAL' || club.includes('TOTAL')) {
                stats.push({ label: 'Matchs (LNH)', value: matches.replace(/[^\d]/g, ''), unit: '' })
                stats.push({ label: 'Buts (LNH)', value: goals.split('/')[0].trim(), unit: '' })
                stats.push({ label: 'Efficacité', value: efficiency.replace('%', '').trim(), unit: '%' })
              }
            }
          })
        }
      }

      // Fallback si pas de club actuel trouvé dans le tableau
      const locationVal = currentClub ? `${currentClub}, ${nationality}` : nationality

      return NextResponse.json({
        first,
        last,
        sport: 'Autre', // On propose d'ajuster ou 'Autre' par défaut pour le handball
        discipline: discipline || 'Handballeur',
        location: locationVal,
        avatar,
        stats,
        career,
        palmares: []
      })

    } else if (url.includes('transfermarkt')) {
      // --- SCRAPER TRANSFERMARKT ---
      const response = await fetch(url, { headers })
      if (!response.ok) {
        return NextResponse.json({ error: `Impossible de charger la page Transfermarkt (${response.status})` }, { status: 500 })
      }
      const html = await response.text()
      const $ = cheerio.load(html)

      const nameRaw = $('h1').first().text().trim().replace(/#\d+\s+/, '')
      if (!nameRaw) {
        return NextResponse.json({ error: 'Impossible de lire les informations du joueur sur cette page Transfermarkt.' }, { status: 400 })
      }

      const parts = nameRaw.split(/\s+/)
      const first = parts[0] || ''
      const last = parts.slice(1).join(' ') || ''
      
      let avatar = $('img.data-header__profile-image').attr('src') || ''
      if (avatar && !avatar.startsWith('http')) {
        avatar = new URL(avatar, 'https://www.transfermarkt.com').toString()
      }

      let dob = ''
      let nationality = ''
      let height = ''
      let position = ''
      let foot = ''
      let currentClub = ''
      
      const capsGoals = $('.data-header__label:contains("Caps/Goals"), .data-header__label:contains("Sélections"), .data-header__label:contains("sélections")')
        .find('a').text().trim().replace(/\s+/g, ' ')

      $('.info-table__content--regular').each((_, el) => {
        const key = $(el).text().trim().toLowerCase()
        const valEl = $(el).next('.info-table__content--bold')
        if (valEl.length > 0) {
          const val = valEl.text().trim().replace(/\s+/g, ' ')
          if ((key.includes('naissance') || key.includes('birth')) && !key.includes('lieu') && !key.includes('place')) {
            dob = val
          } else if (key.includes('nationalit') || key.includes('citizenship')) {
            nationality = val
          } else if (key.includes('taille') || key.includes('height')) {
            height = val
          } else if (key.includes('position')) {
            position = val
          } else if (key.includes('pied') || key.includes('foot')) {
            foot = val
          } else if (key.includes('club actuel') || key.includes('current club')) {
            currentClub = val
          }
        }
      })

      // Valeur marchande
      let marketValue = $('.data-header__market-value-wrapper').first().text().trim().replace(/\s+/g, ' ')
      if (!marketValue) {
        const matches = html.match(/(\d+[\d,.]*\s*(?:mio\s*€|m|k|M|m\s*€|€))/i)
        if (matches) marketValue = matches[0]
      }

      const stats: Array<{ label: string; value: string; unit: string }> = []
      
      // Ajouter les caractéristiques physiques aux statistiques
      if (height) {
        stats.push({ label: 'Taille', value: height.replace(/[^\d,.]/g, ''), unit: 'm' })
      }
      if (dob) {
        stats.push({ label: 'Naissance', value: dob.split(' ')[0] || dob, unit: '' })
      }
      if (marketValue) {
        const valPart = marketValue.split(' ')[0]
        stats.push({ label: 'Valeur marchande', value: valPart, unit: marketValue.includes('mio') || marketValue.includes('m') ? 'M€' : '€' })
      }
      if (capsGoals) {
        const capsParts = capsGoals.split(/[\/\s]+/)
        if (capsParts[0]) stats.push({ label: 'Sélections', value: capsParts[0].trim(), unit: '' })
        if (capsParts[1]) stats.push({ label: 'Buts Inter.', value: capsParts[1].trim(), unit: '' })
      }
      if (foot) {
        stats.push({ label: 'Pied fort', value: foot, unit: '' })
      }

      const career: Array<{ year: string; club: string; detail: string }> = []
      if (currentClub) {
        career.push({
          year: 'Actuel',
          club: currentClub,
          detail: position || 'Joueur'
        })
      }

      const locationVal = currentClub ? `${currentClub}, ${nationality}` : nationality

      return NextResponse.json({
        first,
        last,
        sport: 'Football',
        discipline: position || 'Footballeur',
        location: locationVal,
        avatar,
        stats,
        career,
        palmares: []
      })

    } else {
      return NextResponse.json({ error: 'Seuls les liens de la LNH (lnh.fr) et Transfermarkt sont pris en charge actuellement.' }, { status: 400 })
    }

  } catch (err: unknown) {
    console.error('Import error:', err)
    const msg = err instanceof Error ? err.message : 'Une erreur interne est survenue.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
