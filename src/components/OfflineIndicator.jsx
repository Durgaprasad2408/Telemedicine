import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

const OfflineIndicator = () => {
  const { isOnline } = usePWA()
  const [showOffline, setShowOffline] = useState(false)
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true)
      setShowOnline(false)
    } else {
      setShowOffline(false)
      // Show "back online" message briefly
      if (showOffline) {
        setShowOnline(true)
        const timer = setTimeout(() => {
          setShowOnline(false)
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOnline, showOffline])

  return (
    <AnimatePresence>
      {showOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 lg:top-20 left-4 right-4 lg:left-68 lg:right-4 z-40"
        >
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <WifiOff size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">You're offline</p>
              <p className="text-xs opacity-90">Some features may not be available</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {showOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 lg:top-20 left-4 right-4 lg:left-68 lg:right-4 z-40"
        >
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <Wifi size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">You're back online</p>
              <p className="text-xs opacity-90">All features are now available</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineIndicator