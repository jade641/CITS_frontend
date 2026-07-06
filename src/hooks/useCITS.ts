import { useContext } from 'react'

import { CITSContext } from '../contexts/CITSContext'

export function useCITS() {
  const context = useContext(CITSContext)

  if (!context) {
    throw new Error('useCITS must be used within a CITSContextProvider.')
  }

  return context
}