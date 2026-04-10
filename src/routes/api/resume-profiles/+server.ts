import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { resumeProfileDAO } from '$lib/server/db'

/**
 * Returns all structured resume profiles for a specific job.
 */
export const GET: RequestHandler = ({ url }) => {
  const jobId = url.searchParams.get('jobId')
  if (!jobId) {
    return json({ success: false, error: 'Missing required query param: jobId' }, { status: 400 })
  }

  try {
    const profiles = resumeProfileDAO
      .getByJobId(jobId)
      .map((profile) => resumeProfileDAO.getFullById(profile.id))
      .filter((profile): profile is NonNullable<typeof profile> => profile !== undefined)

    return json({ success: true, data: profiles })
  } catch (error) {
    console.error('GET /api/resume-profiles error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
