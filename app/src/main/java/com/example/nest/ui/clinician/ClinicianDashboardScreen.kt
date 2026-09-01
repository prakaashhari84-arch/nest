package com.example.nest.ui.clinician

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.example.nest.data.model.PatternAlert
import com.example.nest.data.model.SeverityLevel
import com.example.nest.viewmodel.NestViewModel

@Composable
fun ClinicianDashboardScreen(
    user: AppUser,
    viewModel: NestViewModel
) {
    val profiles by viewModel.allChildProfiles.collectAsState()
    val selectedChildId by viewModel.selectedChildId.collectAsState()
    val alerts by viewModel.allAlerts.collectAsState()
    val therapyGoals by viewModel.allTherapyActivities.collectAsState()

    var activeTab by remember { mutableStateOf(0) } // 0: Caseload & Alerts, 1: AI Rule Sets & Triggers, 2: Assign Goals, 3: Care Team

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFAF8F5))
    ) {
        // Clinician Header Card
        Card(
            shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B2E)),
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
                            text = "Clinician Supervision Console",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "${user.name} • Active Caseload: ${profiles.size} Patients",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFC4B5FD)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                ScrollableTabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color.Transparent,
                    contentColor = Color(0xFFC4B5FD),
                    edgePadding = 0.dp,
                    divider = {}
                ) {
                    listOf("Caseload & Alerts 🚨", "Safety Rules Engine ⚙️", "Assign Goals 🎯", "Care Team Messages 💬").forEachIndexed { index, title ->
                        Tab(
                            selected = activeTab == index,
                            onClick = { activeTab = index },
                            text = { Text(title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = if (activeTab == index) Color.White else Color(0xFFA78BFA)) }
                        )
                    }
                }
            }
        }

        // Tab Content
        Box(modifier = Modifier.weight(1f).padding(16.dp)) {
            when (activeTab) {
                0 -> ClinicianCaseloadTab(profiles, alerts, viewModel)
                1 -> ClinicianRulesEngineTab()
                2 -> ClinicianAssignGoalsTab(profiles, selectedChildId, viewModel)
                3 -> ClinicianCareTeamTab(viewModel)
            }
        }
    }
}

@Composable
fun ClinicianCaseloadTab(
    profiles: List<com.example.nest.data.model.ChildProfile>,
    alerts: List<PatternAlert>,
    viewModel: NestViewModel
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Text(
                text = "PATIENT CASELOAD SUMMARY",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black,
                color = Color(0xFF78716C)
            )
        }

        items(profiles) { profile ->
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
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
                                text = "${profile.nickname} (Age ${profile.age})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E1B2E)
                            )
                            Text(
                                text = "Companion: ${profile.companionName} (${profile.companionVibe.displayName})",
                                fontSize = 12.sp,
                                color = Color(0xFF6B46C1)
                            )
                        }

                        if (profile.hasTraumaHistory) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFFEF3C7))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text("Trauma-Sensitive", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                            }
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "SAFETY ALERTS REQUIRING CLINICAL REVIEW",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black,
                color = Color(0xFF78716C)
            )
        }

        if (alerts.isEmpty()) {
            item {
                Text("No active alerts at this time.", color = Color.Gray, fontSize = 13.sp)
            }
        } else {
            items(alerts) { alert ->
                var reviewNote by remember { mutableStateOf("") }
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
                                text = "${alert.childName} • ${alert.category}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = if (alert.severity == SeverityLevel.SERIOUS) Color(0xFF9F1239) else Color(0xFF92400E)
                            )
                            Text(
                                text = if (alert.reviewedByHuman) "Reviewed ✓" else "Pending Review ⏳",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (alert.reviewedByHuman) Color(0xFF059669) else Color(0xFFD97706)
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(alert.summary, style = MaterialTheme.typography.bodySmall, color = Color(0xFF1E1B2E))

                        if (!alert.reviewedByHuman) {
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = reviewNote,
                                onValueChange = { reviewNote = it },
                                placeholder = { Text("Clinical observation / review note...") },
                                textStyle = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { viewModel.markAlertReviewed(alert.id, reviewNote) },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E))
                            ) {
                                Text("Approve & Mark Human-Reviewed", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClinicianRulesEngineTab() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "AI SAFETY RULES & ESCALATION ENGINE (HIERARCHY RESOLVED)",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("🟢 Allowed / Encouraged Topics", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF065F46))
                Spacer(modifier = Modifier.height(4.dp))
                Text("Everyday friendships, hobbies, emotional regulation, bedtime calm, school storytelling, breathwork.", fontSize = 12.sp, color = Color(0xFF57534E))

                Divider(modifier = Modifier.padding(vertical = 10.dp))

                Text("🔴 Strictly Forbidden AI Directives", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF9F1239))
                Spacer(modifier = Modifier.height(4.dp))
                Text("Medical diagnosis, clinical advice, medication instructions, claiming human consciousness, interrogating trauma.", fontSize = 12.sp, color = Color(0xFF57534E))

                Divider(modifier = Modifier.padding(vertical = 10.dp))

                Text("⚡ Escalation Trigger Keywords", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF6B46C1))
                Spacer(modifier = Modifier.height(4.dp))
                Text("• \"hate myself\" -> SERIOUS (Safety intervention alert created)\n• \"scared of dad\" / \"hit me\" -> SERIOUS (Domestic safety flag)\n• \"bullied\" / \"failing\" -> MILD (Observation note)", fontSize = 12.sp, color = Color(0xFF57534E))
            }
        }
    }
}

@Composable
fun ClinicianAssignGoalsTab(
    profiles: List<com.example.nest.data.model.ChildProfile>,
    selectedChildId: String,
    viewModel: NestViewModel
) {
    var title by remember { mutableStateOf("") }
    var instructions by remember { mutableStateOf("") }
    var skill by remember { mutableStateOf("Articulation & Turn-Taking") }
    var assignedSuccess by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "ASSIGN NEW THERAPY ACTIVITY",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Activity Title") },
                    placeholder = { Text("e.g. Practice /r/ phonemes during dinner storytelling") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                OutlinedTextField(
                    value = skill,
                    onValueChange = { skill = it },
                    label = { Text("Target Behavioral / Speech Skill") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                OutlinedTextField(
                    value = instructions,
                    onValueChange = { instructions = it },
                    label = { Text("Parent & Child Instructions") },
                    placeholder = { Text("Detailed guidance for home practice...") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    minLines = 3
                )

                Button(
                    onClick = {
                        viewModel.assignTherapyGoal(title, instructions, skill)
                        title = ""
                        instructions = ""
                        assignedSuccess = true
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E1B2E))
                ) {
                    Text("Assign to Patient & Caregiver", fontWeight = FontWeight.Bold)
                }

                if (assignedSuccess) {
                    Text("Activity successfully assigned to patient record!", color = Color(0xFF059669), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun ClinicianCareTeamTab(viewModel: NestViewModel) {
    val messages by viewModel.careTeamMessages.collectAsState()
    var input by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages) { msg ->
                val isMe = msg.senderRole == com.example.nest.data.model.UserRole.CLINICIAN
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                ) {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isMe) Color(0xFF1E1B2E) else Color.White
                        ),
                        modifier = Modifier.widthIn(max = 280.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = msg.senderName,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isMe) Color(0xFFC4B5FD) else Color(0xFF6B46C1)
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
                onValueChange = { input = it },
                placeholder = { Text("Reply as Dr. Vance...") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = {
                    viewModel.sendCareTeamMessage(input)
                    input = ""
                },
                modifier = Modifier.clip(androidx.compose.foundation.shape.CircleShape).background(Color(0xFF1E1B2E))
            ) {
                Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White)
            }
        }
    }
}
