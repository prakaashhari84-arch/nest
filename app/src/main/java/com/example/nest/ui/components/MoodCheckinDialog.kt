package com.example.nest.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.nest.data.model.MoodType

@Composable
fun MoodCheckinDialog(
    companionName: String,
    onDismiss: () -> Unit,
    onSubmit: (MoodType, String?, String?) -> Unit
) {
    var selectedMood by remember { mutableStateOf<MoodType?>(null) }
    var selectedStarter by remember { mutableStateOf<String?>(null) }
    var noteText by remember { mutableStateOf("") }

    val starters = when (selectedMood) {
        MoodType.HAPPY -> listOf("Had fun with friends", "Learned something cool", "Ate yummy food", "Felt super proud")
        MoodType.MILD -> listOf("Just a regular day", "School was okay", "Feeling a bit sleepy", "Quiet afternoon")
        MoodType.SAD -> listOf("Felt left out", "Hard homework", "Missed someone", "Just felt gloomy")
        null -> emptyList()
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Daily Heart Check-In",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E1B2E)
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Text(
                    text = "How does your heart feel today, explorer?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF78716C)
                )

                Spacer(modifier = Modifier.height(20.dp))

                // 3 Mood Options
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    MoodType.values().forEach { mood ->
                        val isSelected = selectedMood == mood
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(18.dp))
                                .clickable { selectedMood = mood }
                                .background(
                                    if (isSelected) Color(0xFFEDE9FE) else Color(0xFFF9F7F4)
                                )
                                .border(
                                    width = if (isSelected) 2.dp else 1.dp,
                                    color = if (isSelected) Color(0xFF6B46C1) else Color.Transparent,
                                    shape = RoundedCornerShape(18.dp)
                                )
                                .padding(horizontal = 14.dp, vertical = 12.dp)
                        ) {
                            Text(text = mood.emoji, fontSize = 36.sp)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = mood.label.split(" ").first(),
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) Color(0xFF4C1D95) else Color(0xFF44403C)
                            )
                        }
                    }
                }

                if (selectedMood != null) {
                    Spacer(modifier = Modifier.height(18.dp))
                    Text(
                        text = "What was the biggest reason?",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF57534E),
                        modifier = Modifier.align(Alignment.Start)
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        starters.forEach { starter ->
                            val isChoice = selectedStarter == starter
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isChoice) Color(0xFFF3E8FF) else Color(0xFFF5F5F4))
                                    .clickable { selectedStarter = starter }
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = starter,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = if (isChoice) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isChoice) Color(0xFF6B46C1) else Color(0xFF292524)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = noteText,
                        onValueChange = { noteText = it },
                        placeholder = { Text("Anything else you want to share with $companionName? (optional)") },
                        textStyle = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        maxLines = 3
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        val mood = selectedMood ?: return@Button
                        onSubmit(mood, selectedStarter, noteText.ifBlank { null })
                    },
                    enabled = selectedMood != null,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6B46C1))
                ) {
                    Text("Save & Earn +10 Sparkles ✨", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
