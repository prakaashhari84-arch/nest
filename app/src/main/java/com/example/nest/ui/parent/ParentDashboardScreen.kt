package com.example.nest.ui.parent

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.nest.data.model.AppUser
import com.example.nest.data.model.SeverityLevel
import com.example.nest.ui.components.MoodSparkline
import com.example.nest.viewmodel.NestViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ParentDashboardScreen(
    user: AppUser,
    viewModel: NestViewModel
) {
    val profiles by viewModel.allChildProfiles.collectAsState()
    val selectedChildId by viewModel.selectedChildId.collectAsState()
    val currentProfile by viewModel.currentChildProfile.collectAsState()
    val moodEntries by viewModel.childMoodEntries.collectAsState()
    val alerts by viewModel.allAlerts.collectAsState()
    val careTeamMessages by viewModel.careTeamMessages.collectAsState()
    val therapyGoals by viewModel.therapyActivities.collectAsState()

    var activeTab by remember { mutableStateOf(0) } // 0: Overview, 1: Therapy & Goals, 2: Care Team Chat, 3: Telehealth
    var messageInput by remember { mutableStateOf("") }
    val dateFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())

    val childAlerts = alerts.filter { it.childId == selectedChildId }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFAF8F5))
    ) {
        // Parent Header
        Card(
            shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Family Care Dashboard",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E1B2E)
                        )
                        Text(
                            text = "Connected with Dr. Marcus Vance, MD",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF6B46C1)
                        )
                    }

                    // Linked Children Switcher
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        profiles.forEach { profile ->
                            val isSelected = profile.userId == selectedChildId
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(if (isSelected) Color(0xFF6B46C1) else Color(0xFFF5F5F4))
                                    .clickable { viewModel.selectChild(profile.userId) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = profile.nickname,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color.White else Color(0xFF57534E)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Navigation Tabs
                ScrollableTabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color.Transparent,
                    contentColor = Color(0xFF6B46C1),
                    edgePadding = 0.dp,
                    divider = {}
                ) {
                    listOf("Insights & Mood 📊", "Therapy Goals 🎯", "Care Team Chat 💬", "Telehealth 📅").forEachIndexed { index, title ->
                        Tab(
                            selected = activeTab == index,
                            onClick = { activeTab = index },
                            text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
                        )
                    }
                }
            }
        }

        // Tab Content
        Box(modifier = Modifier.weight(1f).padding(16.dp)) {
            when (activeTab) {
                0 -> ParentInsightsTab(currentProfile?.nickname ?: "Child", moodEntries, childAlerts)
                1 -> ParentTherapyTab(currentProfile?.nickname ?: "Child", therapyGoals)
                2 -> ParentCareTeamChatTab(
                    messages = careTeamMessages,
                    input = messageInput,
                    onInputChange = { messageInput = it },
                    onSend = {
                        viewModel.sendCareTeamMessage(messageInput)
                        messageInput = ""
                    }
                )
                3 -> ParentTelehealthTab(clinicianName = "Dr. Marcus Vance, MD")
            }
        }
    }
}

@Composable
fun ParentInsightsTab(
    childName: String,
    moodEntries: List<com.example.nest.data.model.MoodEntry>,
    alerts: List<com.example.nest.data.model.PatternAlert>
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            MoodSparkline(entries = moodEntries, maxDays = 14)
        }

        item {
            Text(
                text = "GENTLE WELLNESS PATTERNS",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black,
                color = Color(0xFF78716C)
            )
        }

        if (alerts.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("✨", fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "No unusual distress patterns detected. $childName has had steady, positive interactions this week.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF44403C)
                        )
                    }
                }
            }
        } else {
            items(alerts) { alert ->
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (alert.severity == SeverityLevel.SERIOUS) Color(0xFFFFF1F2) else Color(0xFFFEF3C7)
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (alert.severity == SeverityLevel.SERIOUS) "⚠️ High-Attention Pattern" else "💡 Observation Note",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = if (alert.severity == SeverityLevel.SERIOUS) Color(0xFF9F1239) else Color(0xFF92400E)
                            )
                            Text(
                                text = "Human-Reviewed",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Gray
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(alert.summary, style = MaterialTheme.typography.bodySmall, color = Color(0xFF1E1B2E))

                        if (alert.suggestedStarters.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text("Gentle Conversation Starters:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF57534E))
                            alert.suggestedStarters.forEach { starter ->
                                Text("• \"$starter\"", fontSize = 12.sp, color = Color(0xFF4C1D95), modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ParentTherapyTab(
    childName: String,
    activities: List<com.example.nest.data.model.TherapyActivity>
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Text(
                text = "HOME PRACTICE ACTIVITIES ASSIGNED BY DR. VANCE",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black,
                color = Color(0xFF78716C)
            )
        }

        if (activities.isEmpty()) {
            item {
                Text("No active activities assigned yet.", color = Color.Gray, fontSize = 13.sp)
            }
        } else {
            items(activities) { act ->
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(act.targetSkill, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6B46C1))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFEDE9FE))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(act.status, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF4C1D95))
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(act.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(act.instructions, style = MaterialTheme.typography.bodySmall, color = Color(0xFF57534E))

                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = { /* Upload video simulation */ },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6B46C1)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Videocam, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Record & Submit Practice Clip", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ParentCareTeamChatTab(
    messages: List<com.example.nest.data.model.CareTeamMessage>,
    input: String,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages) { msg ->
                val isMe = msg.senderRole == com.example.nest.data.model.UserRole.PARENT
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                ) {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isMe) Color(0xFF6B46C1) else Color.White
                        ),
                        modifier = Modifier.widthIn(max = 280.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = msg.senderName,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isMe) Color(0xFFDDD6FE) else Color(0xFF6B46C1)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = msg.content,
                                fontSize = 13.sp,
                                color = if (isMe) Color.White else Color(0xFF1E1B2E)
                            )
                        }
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = onInputChange,
                placeholder = { Text("Message Dr. Vance...") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = onSend,
                modifier = Modifier.clip(CircleShape).background(Color(0xFF6B46C1))
            ) {
                Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White)
            }
        }
    }
}

@Composable
fun ParentTelehealthTab(clinicianName: String) {
    var bookedSlot by remember { mutableStateOf<String?>(null) }

    val slots = listOf(
        "Thursday, 3:30 PM (Telehealth Video)",
        "Friday, 10:00 AM (Telehealth Video)",
        "Next Monday, 4:00 PM (In-Clinic / Video)"
    )

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "BOOK A TELEHEALTH CONSULTATION",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        slots.forEach { slot ->
            val isBooked = bookedSlot == slot
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isBooked) Color(0xFFD1FAE5) else Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(slot, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("With $clinicianName", fontSize = 12.sp, color = Color.Gray)
                    }

                    Button(
                        onClick = { bookedSlot = slot },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isBooked) Color(0xFF059669) else Color(0xFF6B46C1)
                        )
                    ) {
                        Text(if (isBooked) "Confirmed ✓" else "Book Slot", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
