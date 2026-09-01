package com.example.nest.ui.child

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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
import com.example.nest.data.model.MoodEntry
import com.example.nest.ui.components.MoodCheckinDialog
import com.example.nest.ui.components.MoodSparkline
import com.example.nest.viewmodel.NestViewModel

@Composable
fun TenToFourteenHome(
    profile: ChildProfile,
    totalPoints: Int,
    moodEntries: List<MoodEntry>,
    viewModel: NestViewModel,
    onNavigateToStory: () -> Unit,
    onNavigateToGames: () -> Unit,
    onNavigateToChat: () -> Unit,
    onNavigateToPlaces: () -> Unit
) {
    var showMoodDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Header & Sparkles
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Welcome back, ${profile.nickname}",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E1B2E)
                )
                Text(
                    text = "Your private sanctuary for focus & recharge",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF78716C)
                )
            }
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0xFFEDE9FE))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("✨ $totalPoints", fontWeight = FontWeight.Bold, color = Color(0xFF6B46C1), fontSize = 13.sp)
            }
        }

        // Daily Checkin Action Card
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Daily Reflection",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Button(
                        onClick = { showMoodDialog = true },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6B46C1)),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Text("Check In", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                val latest = moodEntries.firstOrNull()
                if (latest != null) {
                    Text(
                        text = "Latest: ${latest.mood.emoji} ${latest.mood.label} • \"${latest.promptStarter ?: "Recorded today"}\"",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF57534E)
                    )
                } else {
                    Text(
                        text = "Take 30 seconds to record how your day feels.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
        }

        // Mood Trend Graph
        MoodSparkline(entries = moodEntries, maxDays = 7)

        // Modules Grid (Companion Chat, Places Log, Chill Space, Skill Modules)
        Text(
            text = "WELLNESS MODULES",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE0E7FF)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToChat() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("🤖", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Chat with ${profile.companionName}", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF1E1B4B))
                    Text("Unpack thoughts privately", fontSize = 12.sp, color = Color(0xFF3730A3))
                }
            }

            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFD1FAE5)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToPlaces() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("📍", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Places Log", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF065F46))
                    Text("School, home & room vibes", fontSize = 12.sp, color = Color(0xFF047857))
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToGames() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("🧘", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Chill & Focus", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF78350F))
                    Text("4-7-8 Breathing & Games", fontSize = 12.sp, color = Color(0xFFB45309))
                }
            }

            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF3E8FF)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToStory() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("🌌", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Cosmic Odyssey", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF581C87))
                    Text("Choose-your-own-adventure", fontSize = 12.sp, color = Color(0xFF7E22CE))
                }
            }
        }

        // Life Skill Tip Card
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("💡", fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Mental Toughness Tip: The 5-Minute Reset", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "When overwhelming school deadlines hit, step away for 5 minutes, drink a tall glass of cold water, and stretch your shoulders. You regain focus much faster than powering through fatigue!",
                    fontSize = 13.sp,
                    color = Color(0xFF57534E),
                    lineHeight = 18.sp
                )
            }
        }
    }

    if (showMoodDialog) {
        MoodCheckinDialog(
            companionName = profile.companionName,
            onDismiss = { showMoodDialog = false },
            onSubmit = { mood, starter, note ->
                viewModel.submitMoodCheckin(mood, starter, note)
                showMoodDialog = false
            }
        )
    }
}
