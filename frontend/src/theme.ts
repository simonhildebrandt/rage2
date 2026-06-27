import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#08080c',
        color: '#e9e9ef',
        fontFamily: "'IBM Plex Mono', monospace",
      },
    },
  },
})

export default theme
