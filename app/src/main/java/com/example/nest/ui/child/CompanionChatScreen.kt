package com.example.nest.ui.child

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
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
import com.example.nest.data.model.ConversationTurn
import com.example.nest.ui.components.NestlingBlob
import com.example.nest.viewmodel.NestViewModel
import kotlinx.coroutines.launch

@Composable
fun CompanionChatScreen(
    profile: ChildProfile,
    viewModel: NestViewModel
) {
    val turns by viewModel.conversationTurns.collectAsState()
    val isTyping by viewModel.isCompanionTyping.collectAsState()
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var inputText by remember { mutableStateOf("") }

    val quickStarters = listOf(
        "I had a great day today! 😊",
        "Can you tell me a fun joke? 😂",
        "I'm feeling a little worried about school. 🎒",
        "Let's do a quick calm breathing exercise! 🌿",
        "What's your favorite cosmic adventure? 🚀"
    )

    LaunchedEffect(turns.size, isTyping) {
        if (turns.isNotEmpty()) {
            listState.animateScrollToItem(turns.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFAF8F5))
    ) {
        // Chat Header Banner with Companion Mini-Avatar
        Card(
            shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                NestlingBlob(
                    vibe = profile.companionVibe,
                    size = 48.dp,
                    interactive = false,
                    showAura = false
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = profile.companionName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E1B2E)
                    )
                    Text(
                        text = "${profile.companionVibe.displayName} • Safe AI Friend",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF6B46C1)
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color(0xFFD1FAE5))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text("Always Safe 🛡️", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF065F46))
                }
            }
        }

        // Message List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (turns.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        NestlingBlob(
                            vibe = profile.companionVibe,
                            size = 100.dp,
                            interactive = true
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Say hello to ${profile.companionName}!",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E1B2E)
                        )
                        Text(
                            text = "Share anything about your day, feelings, or questions.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF78716C)
                        )
                    }
                }
            }

            items(turns) { turn ->
                ChatBubble(turn = turn, companionName = profile.companionName)
            }

            if (isTyping) {
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                    ) {
                        Text(
                            text = "${profile.companionName} is thinking...",
                            fontSize = 12.sp,
                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                            color = Color(0xFF78716C)
                        )
                    }
                }
            }
        }

        // Quick Starters Carousel
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(quickStarters) { starter ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFEDE9FE))
                        .clickable {
                            viewModel.sendCompanionMessage(starter)
                        }
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = starter,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF4C1D95)
                    )
                }
            }
        }

        // Bottom Input Row
        Card(
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Message ${profile.companionName}...") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    maxLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF6B46C1),
                        unfocusedBorderColor = Color(0xFFE7E5E4)
                    )
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            val msg = inputText
                            inputText = ""
                            viewModel.sendCompanionMessage(msg)
                        }
                    },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color(0xFF6B46C1))
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White)
                }
            }
        }
    }
}

@Composable
fun ChatBubble(turn: ConversationTurn, companionName: String) {
    val isChild = turn.isFromChild
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isChild) Arrangement.End else Arrangement.Start
    ) {
        if (!isChild) {
            Text("✨", fontSize = 18.sp, modifier = Modifier.padding(end = 6.dp, top = 8.dp))
        }

        Card(
            shape = RoundedCornerShape(
                topStart = 20.dp,
                topEnd = 20.dp,
                bottomStart = if (isChild) 20.dp else 4.dp,
                bottomEnd = if (isChild) 4.dp else 20.dp
            ),
            colors = CardDefaults.cardColors(
                containerColor = if (isChild) Color(0xFF6B46C1) else Color.White
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                if (!isChild) {
                    Text(
                        text = companionName,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF6B46C1)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                Text(
                    text = turn.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isChild) Color.White else Color(0xFF1E1B2E),
                    lineHeight = 20.sp
                )
            }
        }
    }
}
