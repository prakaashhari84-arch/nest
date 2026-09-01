package com.example.nest.ui.child

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.nest.data.model.ChildProfile
import com.example.nest.data.model.CompanionVibe
import com.example.nest.data.model.PointsLedgerEntry
import com.example.nest.ui.components.NestlingBlob
import com.example.nest.viewmodel.NestViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ChildProfileScreen(
    profile: ChildProfile,
    totalPoints: Int,
    pointsLedger: List<PointsLedgerEntry>,
    viewModel: NestViewModel
) {
    val badges = viewModel.badgesCatalog
    val cosmetics = viewModel.cosmeticsCatalog
    val dateFormat = SimpleDateFormat("MMM d", Locale.getDefault())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Mascot Card & Customizer
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                NestlingBlob(
                    vibe = profile.companionVibe,
                    size = 110.dp,
                    interactive = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = profile.companionName,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E1B2E)
                )

                Text(
                    text = "${profile.companionVibe.displayName} • ${profile.companionVibe.subtitle}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF6B46C1)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Vibe switcher chips
                Text(
                    text = "CHANGE COMPANION VIBE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF78716C)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CompanionVibe.values().forEach { vibe ->
                        val isSelected = profile.companionVibe == vibe
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) Color(0xFFEDE9FE) else Color(0xFFF5F5F4))
                                .clickable { viewModel.updateCompanionVibe(vibe) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(vibe.emoji, fontSize = 18.sp)
                                Text(
                                    vibe.name.take(4),
                                    fontSize = 10.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) Color(0xFF6B46C1) else Color(0xFF57534E)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Cosmetics Shop Card
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SPARKLE COSMETICS SHOP",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF78716C)
                    )
                    Text("Balance: ✨ $totalPoints", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                }

                Spacer(modifier = Modifier.height(12.dp))

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    cosmetics.forEach { item ->
                        val canAfford = totalPoints >= item.costPoints
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFFAF8F5))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(item.iconEmoji, fontSize = 24.sp)
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(item.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF1E1B2E))
                                    Text(item.description, fontSize = 11.sp, color = Color(0xFF78716C))
                                }
                            }

                            Button(
                                onClick = { viewModel.buyCosmetic(item) },
                                enabled = canAfford,
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6B46C1)),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text("${item.costPoints} ✨", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Badges Showcase
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "BADGES & TROPHIES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF78716C)
                )

                Spacer(modifier = Modifier.height(12.dp))

                val rows = badges.chunked(2)
                rows.forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        row.forEach { badge ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color(0xFFFEF3C7))
                                    .padding(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(badge.iconEmoji, fontSize = 24.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(badge.name, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF78350F))
                                        Text(badge.description, fontSize = 10.sp, color = Color(0xFF92400E), maxLines = 2)
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        // Points Ledger History
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "SPARKLE ACTIVITY LEDGER",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF78716C)
                )

                Spacer(modifier = Modifier.height(12.dp))

                pointsLedger.take(6).forEach { entry ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(entry.reason, fontWeight = FontWeight.Medium, fontSize = 13.sp, color = Color(0xFF1E1B2E))
                            Text(dateFormat.format(Date(entry.createdAt)), fontSize = 11.sp, color = Color.Gray)
                        }
                        Text(
                            text = if (entry.amount >= 0) "+${entry.amount} ✨" else "${entry.amount} ✨",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (entry.amount >= 0) Color(0xFF10B981) else Color(0xFFF43F5E)
                        )
                    }
                }
            }
        }
    }
}
