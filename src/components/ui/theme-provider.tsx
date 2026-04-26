import { createContext, useContext, useEffect } from "react"

/**
 * PERMANENT FIX: This app only supports light mode.
 * Dark mode has been disabled to prevent UI inconsistencies.
 * The theme is always "light" and cannot be changed.
 */

type Theme = "light"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
}: ThemeProviderProps) {
    // Always use light mode - no localStorage, no system preference
    const theme: Theme = "light"

    useEffect(() => {
        const root = window.document.documentElement

        // Remove any dark class and ensure light mode
        root.classList.remove("dark")
        root.classList.add("light")

        // Clear any stored dark theme preference
        localStorage.removeItem("socialflo-theme")
        localStorage.removeItem("vite-ui-theme")
    }, [])

    const value = {
        theme,
        setTheme: () => {
            // No-op: theme changes are disabled
            console.log("Theme changes are disabled. App only supports light mode.")
        },
    }

    return (
        <ThemeProviderContext.Provider {...value} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
