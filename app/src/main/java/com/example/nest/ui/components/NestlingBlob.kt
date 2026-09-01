package com.example.nest.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.nest.data.model.CompanionVibe

@Composable
fun NestlingBlob(
    vibe: CompanionVibe = CompanionVibe.CHILL,
    size: Dp = 120.dp,
    interactive: Boolean = true,
    showAura: Boolean = true,
    onClick: () -> Unit = {}
) {
    val infiniteTransition = rememberInfiniteTransition(label = "blob_anim")
    val breathScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breath"
    )
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float"
    )

    val (primaryColor, secondaryColor, auraColor) = when (vibe) {
        CompanionVibe.CHILL -> Triple(Color(0xFF8B5CF6), Color(0xFFC4B5FD), Color(0x33A78BFA))
        CompanionVibe.HYPE -> Triple(Color(0xFFF59E0B), Color(0xFFFDE68A), Color(0x33FBBF24))
        CompanionVibe.COZY -> Triple(Color(0xFFEC4899), Color(0xFFFBCFE8), Color(0x33F472B6))
        CompanionVibe.COOL -> Triple(Color(0xFF06B6D4), Color(0xFFA5F3FC), Color(0x3322D3EE))
    }

    Box(
        modifier = Modifier
            .size(size)
            .offset(y = floatOffset.dp)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                enabled = interactive,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasW = this.size.width
            val canvasH = this.size.height
            val center = Offset(canvasW / 2f, canvasH / 2f)
            val radius = (canvasW.coerceAtMost(canvasH) / 2.2f) * breathScale

            // 1. Aura glow
            if (showAura) {
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(auraColor, Color.Transparent),
                        center = center,
                        radius = radius * 1.4f
                    ),
                    radius = radius * 1.4f,
                    center = center
                )
            }

            // 2. Main Mascot Body (Gradient Blob)
            drawCircle(
                brush = Brush.verticalGradient(
                    colors = listOf(secondaryColor, primaryColor),
                    startY = center.y - radius,
                    endY = center.y + radius
                ),
                radius = radius,
                center = center
            )

            // 3. Cute Cheeks (Blush)
            val blushRadius = radius * 0.18f
            drawCircle(
                color = Color(0x55FF69B4),
                radius = blushRadius,
                center = Offset(center.x - radius * 0.45f, center.y + radius * 0.15f)
            )
            drawCircle(
                color = Color(0x55FF69B4),
                radius = blushRadius,
                center = Offset(center.x + radius * 0.45f, center.y + radius * 0.15f)
            )

            // 4. Eyes (Friendly, shiny eyes)
            val eyeRadius = radius * 0.12f
            val leftEye = Offset(center.x - radius * 0.28f, center.y - radius * 0.05f)
            val rightEye = Offset(center.x + radius * 0.28f, center.y - radius * 0.05f)

            drawCircle(color = Color(0xFF1E1B2E), radius = eyeRadius, center = leftEye)
            drawCircle(color = Color(0xFF1E1B2E), radius = eyeRadius, center = rightEye)

            // Eye highlights (sparkle)
            drawCircle(color = Color.White, radius = eyeRadius * 0.4f, center = Offset(leftEye.x - 2f, leftEye.y - 2f))
            drawCircle(color = Color.White, radius = eyeRadius * 0.4f, center = Offset(rightEye.x - 2f, rightEye.y - 2f))

            // 5. Smiling Mouth
            val smilePath = Path().apply {
                moveTo(center.x - radius * 0.18f, center.y + radius * 0.12f)
                quadraticTo(
                    center.x,
                    center.y + radius * 0.32f,
                    center.x + radius * 0.18f,
                    center.y + radius * 0.12f
                )
            }
            drawPath(
                path = smilePath,
                color = Color(0xFF1E1B2E),
                style = Stroke(width = radius * 0.06f)
            )
        }
    }
}
