// src/components/AppLayout.jsx
import { Link as RouterLink, NavLink, Outlet, useNavigate } from "react-router-dom"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import GFilesLogo from "./GFilesLogo"
import { useAuth } from "../contexts/AuthContext"

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 76, gap: 1 }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none" }}
            >
              <GFilesLogo size={52} />
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 700,
                  fontSize: 32,
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                  color: "text.primary",
                }}
              >
                GFiles
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              component={NavLink}
              to="/"
              end
              color="inherit"
              sx={{
                minHeight: 44,
                borderRadius: 0,
                borderBottom: "3px solid transparent",
                "&.active": { borderBottomColor: "primary.main" },
              }}
            >
              Dashboard
            </Button>
            <Button color="inherit" onClick={handleLogout} sx={{ minHeight: 44 }}>
              Log Out
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Outlet />
      </Container>
    </>
  )
}
