// src/components/DashboardToolbar.jsx
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import SearchIcon from "@mui/icons-material/Search"
import ViewListIcon from "@mui/icons-material/ViewList"
import ViewModuleIcon from "@mui/icons-material/ViewModule"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "soon", label: "Expiring soon" },
  { value: "inactive", label: "Used up or expired" },
]

const VIEWS = [
  { value: "grid", label: "Grid view", icon: <ViewModuleIcon /> },
  { value: "list", label: "List view", icon: <ViewListIcon /> },
]

export default function DashboardToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  counts,
}) {
  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 3 }}>
      <TextField
        placeholder="Search by store"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: "1 1 260px", minWidth: 0, bgcolor: "background.paper", borderRadius: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
          htmlInput: { "aria-label": "Search by store" },
        }}
      />

      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
        {FILTERS.map((item) => {
          const selected = filter === item.value
          return (
            <Chip
              key={item.value}
              label={`${item.label} ${counts[item.value]}`}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => onFilterChange(item.value)}
              sx={{ height: 44, borderRadius: 22, px: 1, fontWeight: 500 }}
            />
          )
        })}
      </Stack>

      <TextField
        select
        label="Sort by"
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        sx={{ minWidth: 200, bgcolor: "background.paper", borderRadius: 1 }}
      >
        <MenuItem value="expiring">Expiring soonest</MenuItem>
        <MenuItem value="balance">Highest balance</MenuItem>
        <MenuItem value="name">Store name</MenuItem>
      </TextField>

      <Stack direction="row" spacing={0.5}>
        {VIEWS.map((item) => {
          const selected = view === item.value
          return (
            <IconButton
              key={item.value}
              aria-label={item.label}
              aria-pressed={selected}
              onClick={() => onViewChange(item.value)}
              sx={{
                width: 44,
                height: 44,
                bgcolor: selected ? "#D8F3EE" : "transparent",
                color: selected ? "primary.main" : "text.secondary",
              }}
            >
              {item.icon}
            </IconButton>
          )
        })}
      </Stack>
    </Stack>
  )
}
