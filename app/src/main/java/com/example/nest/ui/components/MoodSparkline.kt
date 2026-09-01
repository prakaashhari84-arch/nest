package com.example.nest.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.nest.data.model.MoodEntry
import com.example.nest.data.model.MoodType
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MoodSparkline(
    entries: List<MoodEntry>,
    modifier: Modifier = Modifier,
    maxDays: Int = 14
) {
    val sorted = entries.sortedBy { it.createdAt }.takeLast(maxDays)
    val dateFormat = SimpleDateFormat("MMM d", Locale.getDefault())

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "MOOD RHYTHM (${maxDays}D)",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black,
                color = Color(0xFF78716C)
            )
            val avg = if (sorted.isNotEmpty()) sorted.map { it.mood.score }.average() else 3.0
            Text(
                text = when {
                    avg >= 2.5 -> "😊 Bright & steady"
                    avg >= 1.8 -> "😐 Balanced"
                    else -> "😔 Some tough days"
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF4C1D95)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (sorted.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No check-ins recorded yet.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }
        } else {
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(70.dp)
            ) {
                val w = size.width
                val h = size.height
                val padY = 10f
                val usableH = h - padY * 2

                val points = sorted.mapIndexed { index, entry ->
                    val x = if (sorted.size == 1) w / 2f else (index.toFloat() / (sorted.size - 1)) * w
                    val y = padY + (3 - entry.mood.score) / 2f * usableH
                    Offset(x, y) to entry
                }

                // Draw connecting curve
                val path = Path().apply {
                    points.forEachIndexed { i, (point, _) ->
                        if (i == 0) moveTo(point.x, point.y)
                        else {
                            val prev = points[i - 1].first
                            val cx = (prev.x + point.x) / 2f
                            cubicTo(cx, prev.y, cx, point.y, point.x, point.y)
                        }
                    }
                }

                drawPath(
                    path = path,
                    color = Color(0xFF8B5CF6),
                    style = Stroke(width = 4f)
                )

                // Draw Dots
                points.forEach { (point, entry) ->
                    val dotColor = when (entry.mood) {
                        MoodType.HAPPY -> Color(0xFF10B981)
                        MoodType.MILD -> Color(0xFFF59E0B)
                        MoodType.SAD -> Color(0xFFF43F5E)
                    }
                    drawCircle(color = Color.White, radius = 7f, center = point)
                    drawCircle(color = dotColor, radius = 5f, center = point)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Range Labels
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = if (sorted.isNotEmpty()) dateFormat.format(Date(sorted.first().createdAt)) else "",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
                Text(
                    text = "Today",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
        }
    }
}
