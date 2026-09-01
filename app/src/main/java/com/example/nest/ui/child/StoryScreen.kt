package com.example.nest.ui.child

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.nest.data.model.ChildProfile
import com.example.nest.viewmodel.NestViewModel

@Composable
fun StoryScreen(
    profile: ChildProfile,
    viewModel: NestViewModel
) {
    val currentChapterIndex by viewModel.currentStoryChapterIndex.collectAsState()
    val chapters = viewModel.storyChapters
    val chapter = chapters.getOrElse(currentChapterIndex) { chapters[0] }

    var selectedChoice by remember { mutableStateOf<Int?>(null) }
    var showRewardBanner by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Story Book Header Card
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF4C1D95), Color(0xFF1E1B4B))
                        )
                    )
                    .padding(24.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "CHAPTER ${chapter.index + 1} OF ${chapters.size}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFFC4B5FD)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = chapter.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = chapter.imageEmoji,
                        fontSize = 64.sp
                    )
                }
            }
        }

        // Narrative Text Card
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = chapter.narrative,
                    style = MaterialTheme.typography.bodyLarge,
                    lineHeight = 26.sp,
                    color = Color(0xFF292524)
                )

                if (chapter.reflectionPrompt != null) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFFFAF5FF))
                            .padding(14.dp)
                    ) {
                        Column {
                            Text(
                                text = "💭 Thought Prompt",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF6B46C1)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = chapter.reflectionPrompt,
                                fontSize = 14.sp,
                                color = Color(0xFF4C1D95),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }

        // Choices
        Text(
            text = "WHAT WILL YOU AND ${profile.companionName.uppercase()} DO NEXT?",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            chapter.choices.forEachIndexed { idx, choice ->
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (selectedChoice == idx) Color(0xFFEDE9FE) else Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            selectedChoice = idx
                            viewModel.advanceStoryChapter(choice.nextChapterIndex, choice.pointsAwarded)
                            showRewardBanner = true
                        }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = choice.text,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF1E1B2E),
                            modifier = Modifier.weight(1f)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "+${choice.pointsAwarded} ✨",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = Color(0xFF6B46C1)
                        )
                    }
                }
            }
        }

        if (showRewardBanner) {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFD1FAE5)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🎉", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Starlight Sparkles Earned!", fontWeight = FontWeight.Bold, color = Color(0xFF065F46))
                        Text("You and ${profile.companionName} are advancing through the galaxy.", fontSize = 12.sp, color = Color(0xFF047857))
                    }
                }
            }
        }
    }
}
