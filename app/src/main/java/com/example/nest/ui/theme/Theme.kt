package com.example.nest.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Purple40,
    onPrimary = Color.White,
    primaryContainer = PurpleLight,
    onPrimaryContainer = PurpleDark,
    secondary = AmberAccent,
    onSecondary = Color.Black,
    secondaryContainer = AmberLight,
    onSecondaryContainer = Color(0xFF78350F),
    tertiary = EmeraldAccent,
    onTertiary = Color.White,
    tertiaryContainer = EmeraldLight,
    onTertiaryContainer = Color(0xFF065F46),
    background = NestBackground,
    onBackground = Color(0xFF1C1917),
    surface = NestSurface,
    onSurface = Color(0xFF1C1917),
    surfaceVariant = Color(0xFFF5F2EC),
    onSurfaceVariant = Color(0xFF57534E),
    outline = Color(0xFFE7E5E4),
    error = RoseAccent,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = Purple80,
    onPrimary = PurpleDark,
    primaryContainer = Color(0xFF3B0764),
    onPrimaryContainer = PurpleLight,
    secondary = AmberAccent,
    onSecondary = Color.Black,
    background = Color(0xFF12111A),
    onBackground = Color(0xFFF5F2EC),
    surface = Color(0xFF1E1B2E),
    onSurface = Color(0xFFF5F2EC),
    surfaceVariant = Color(0xFF2B273F),
    onSurfaceVariant = Color(0xFFD6D3D1),
    outline = Color(0xFF44403C)
)

@Composable
fun NestTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
