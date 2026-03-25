declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean
      showConfirm?: (message: string) => Promise<boolean>
    }
  }
}

export async function showConfirm(message: string): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI?.showConfirm) {
    return window.electronAPI.showConfirm(message)
  }
  return window.confirm(message)
}
