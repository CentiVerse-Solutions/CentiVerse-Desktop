import React, { useContext } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Tooltip,
    Container,
    useScrollTrigger,
    Button
} from '@mui/material';
import { ThemeContext } from '../../../context/ThemeContext';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { darkMode, toggleTheme } = useContext(ThemeContext);
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const [anchorElNav, setAnchorElNav] = React.useState(null);

    // Handle scroll effect
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const pages = [
        { name: 'Dashboard', path: '/' },
        { name: 'Groups', path: '/groups' },
        { name: 'Activity', path: '/activity' },
        { name: 'Friends', path: '/friends' }
    ];

    const settings = [
        { name: 'Profile', action: () => { } },
        { name: 'Account', action: () => { } },
        { name: 'Settings', action: () => { } },
        { name: 'Logout', action: () => { } }
    ];

    const logo = "CentiVerse";

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                transition: 'all 0.3s',
                m: 2,
                width: 'calc(100% - 32px)',
                borderRadius: 2,
            }}
            className={`${trigger ? (darkMode ? 'bg-gray-800/95' : 'bg-white/95') : ''}`}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters className="h-16">
                    {/* Logo - Desktop */}
                    <Typography
                        variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontWeight: 700,
                            letterSpacing: '.2rem',
                            color: darkMode ? 'white' : 'primary.dark',
                            textDecoration: 'none',
                        }}
                        className="transition-all duration-300"
                    >
                        {logo}
                    </Typography>

                    {/* Mobile menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="menu"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {pages.map((page) => (
                                <MenuItem
                                    key={page.name}
                                    onClick={handleCloseNavMenu}
                                    component={Link}
                                    to={page.path}
                                >
                                    <Typography textAlign="center">{page.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    {/* Logo - Mobile */}
                    <Typography
                        variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontWeight: 700,
                            letterSpacing: '.2rem',
                            color: darkMode ? 'white' : 'primary.dark',
                            textDecoration: 'none',
                        }}
                    >
                        {logo}
                    </Typography>

                    {/* Desktop Navigation Links */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} className="ml-6">
                        {pages.map((page) => (
                            <Button
                                key={page.name}
                                component={Link}
                                to={page.path}
                                onClick={handleCloseNavMenu}
                                sx={{
                                    color: darkMode ? 'white' : 'text.primary',
                                    mx: 1.5,
                                    '&:hover': {
                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                                className="transition-all duration-300 hover:text-teal-500"
                            >
                                {page.name}
                            </Button>
                        ))}
                    </Box>

                    {/* Right icons */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Notifications */}
                        <Tooltip title="Notifications">
                            <IconButton
                                color="inherit"
                                className="mr-1"
                                sx={{
                                    mr: 1,
                                    color: darkMode ? 'white' : 'text.primary'
                                }}
                            >
                                <Badge badgeContent={3} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* Theme Toggle */}
                        <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                            <IconButton
                                onClick={toggleTheme}
                                color="inherit"
                                sx={{
                                    mr: 2,
                                    color: darkMode ? 'white' : 'text.primary'
                                }}
                            >
                                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                            </IconButton>
                        </Tooltip>

                        {/* User Menu */}
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    <Avatar
                                        alt="User Avatar"
                                        src="/avatar.jpg"
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: darkMode ? 'primary.main' : 'primary.light'
                                        }}
                                    >
                                        <AccountCircleIcon />
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                {settings.map((setting) => (
                                    <MenuItem key={setting.name} onClick={() => {
                                        setting.action();
                                        handleCloseUserMenu();
                                    }}>
                                        <Typography textAlign="center">{setting.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;