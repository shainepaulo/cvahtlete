/**
 * Intégration du SDK Officiel pCloud (`pcloud-sdk-js`).
 * Documentation SDK : https://github.com/pcloud/pcloud-sdk-js
 */

import pcloudSdk from 'pcloud-sdk-js'

export async function uploadToPcloud(
  file: File,
  filename: string
): Promise<{ url: string } | { error: string }> {
  const token = process.env.PCLOUD_ACCESS_TOKEN
  if (!token) {
    return { error: "PCLOUD_ACCESS_TOKEN non configuré dans .env.local." }
  }

  const folderId = Number(process.env.PCLOUD_FOLDER_ID || 0)

  try {
    const client = pcloudSdk.createClient(token)

    // Conversion du fichier pour l'upload via le SDK pCloud
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload via le SDK officiel pCloud
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadResult = await client.upload(buffer as unknown as string, folderId, {
      filename: filename,
    } as any) as { fileid?: number; metadata?: Array<{ fileid: number }>; result?: number }

    const fileId = uploadResult?.fileid || uploadResult?.metadata?.[0]?.fileid
    if (!fileId) {
      return { error: "Échec du téléversement pCloud via le SDK." }
    }

    // Récupération du lien direct de lecture vidéo via getfilelink du SDK
    const linkInfo = await client.getfilelink(fileId) as { result?: number; hosts?: string[]; path?: string }
    if (linkInfo && linkInfo.hosts && linkInfo.hosts.length > 0 && linkInfo.path) {
      return { url: `https://${linkInfo.hosts[0]}${linkInfo.path}` }
    }

    return { error: "Fichier envoyé sur pCloud via SDK, mais impossible d'obtenir le lien de streaming direct." }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Erreur SDK pCloud : ${msg}` }
  }
}
