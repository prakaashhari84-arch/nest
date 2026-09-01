package com.example.nest.ui.child

import androidx.compose.animation.*
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.nest.data.model.ChildProfile
import com.example.nest.data.model.MoodEntry
import com.example.nest.ui.components.MoodCheckinDialog
import com.example.nest.ui.components.NestlingBlob
import com.example.nest.viewmodel.NestViewModel

@Composable
fun SixToTenHome(
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
    var mascotPokeCount by remember { mutableStateOf(0) }
    var mascotSpeech by remember { mutableStateOf("Hi ${profile.nickname}! Tap me for a surprise cheer!") }

    val latestMood = moodEntries.firstOrNull()

    val jokes = listOf(
        "Why do birds fly south in the winter? Because it's too far to walk! 🦅",
        "What do you call a sleeping dinosaur? A dino-snore! 🦖",
        "Why did the teddy bear say no to dessert? Because she was already stuffed! 🧸",
        "What does a cloud wear under its raincoat? Thunder-wear! ⚡"
    )
    val dailyJoke = jokes[((System.currentTimeMillis() / 86400000L) % jokes.size).toInt()]

    val facts = listOf(
        "Did you know? Sea otters hold hands when they sleep so they don't drift apart! 🦦",
        "Did you know? Honey never spoils! Pots of honey from ancient tombs are still good! 🍯",
        "Did you know? Flamingos are pink because they eat tiny shrimp and algae! 🦩"
    )
    val dailyFact = facts[((System.currentTimeMillis() / 86400000L) % facts.size).toInt()]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Mascot Hero Card
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFFEDE9FE), Color.White)
                        )
                    )
                    .padding(20.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Points Pill
                    Row(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFFFEF3C7))
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("✨ $totalPoints Sparkles", fontWeight = FontWeight.Black, fontSize = 13.sp, color = Color(0xFF92400E))
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Animated Blob
                    NestlingBlob(
                        vibe = profile.companionVibe,
                        size = 130.dp,
                        interactive = true,
                        onClick = {
                            mascotPokeCount++
                            mascotSpeech = when (mascotPokeCount % 4) {
                                1 -> "Giggle! That tickles! You are doing awesome today! ⭐"
                                2 -> "Ready for a big adventure through the starlight gate? 🚀"
                                3 -> "Remember: You are strong, kind, and super creative! 💖"
                                else -> "High five! Let's make today fantastic! ✋"
                            }
                            viewModel.earnGamePoints(2, "Companion Poke Cheer")
                        }
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "${profile.companionName} says:",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF6B46C1)
                    )
                    Text(
                        text = "\"$mascotSpeech\"",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E1B2E),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Mood Check-in CTA Button
                    Button(
                        onClick = { showMoodDialog = true },
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6B46C1)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (latestMood != null) "Today: ${latestMood.mood.emoji} ${latestMood.mood.label} (Tap to update)" else "How are you feeling right now?",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }

        // Quick Action Grid (Cosmic Story, Brain Games, Places, Chat)
        Text(
            text = "TODAY'S ADVENTURES",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Story Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF3E8FF)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToStory() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("📖", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Cosmic Story", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF581C87))
                    Text("Chapter 1: The Nebula Gate", fontSize = 12.sp, color = Color(0xFF7E22CE))
                }
            }

            // Games Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToGames() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("🎮", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Brain Games", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF78350F))
                    Text("Puzzles & Memory", fontSize = 12.sp, color = Color(0xFFB45309))
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Places Checkin Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFD1FAE5)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToPlaces() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("📍", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Your Places", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF065F46))
                    Text("School, Home & Swings", fontSize = 12.sp, color = Color(0xFF047857))
                }
            }

            // Chat with Pip
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE0E7FF)),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToChat() }
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("💬", fontSize = 28.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Talk to ${profile.companionName}", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF1E1B4B))
                    Text("Safe & friendly chats", fontSize = 12.sp, color = Color(0xFF3730A3))
                }
            }
        }

        // Daily Giggle & Fun Fact
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("😂", fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Joke of the Day", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E1B2E))
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(dailyJoke, fontSize = 13.sp, color = Color(0xFF44403C))

                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF5F5F4))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🌟", fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Did You Know?", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E1B2E))
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(dailyFact, fontSize = 13.sp, color = Color(0xFF44403C))
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
