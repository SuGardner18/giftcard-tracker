// src/theme.js
import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    primary: { main: "#17766A" },
    background: { default: "#FFF6E9", paper: "#FFFFFF" },
    text: { primary: "#2E2250", secondary: "#5A4B7C" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    h2: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    h3: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Fredoka", sans-serif', fontWeight: 600 },
  },
  components: {
   
    MuiButton: { styleOverrides: { root: { borderRadius: 24 } } },
  },
})

export default theme