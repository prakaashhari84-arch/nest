package com.example.nest.ui.child

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.nest.data.model.ChildProfile
import com.example.nest.data.model.PlaceType
import com.example.nest.viewmodel.NestViewModel

@Composable
fun PlacesCheckinScreen(
    profile: ChildProfile,
    viewModel: NestViewModel
) {
    val places = PlaceType.values()
    var selectedRatings by remember { mutableStateOf(mutableMapOf<PlaceType, Int>()) }
    var notesMap by remember { mutableStateOf(mutableMapOf<PlaceType, String>()) }
    var savedSuccess by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "HOW DO YOUR PLACES FEEL?",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF065F46)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Check in on your everyday spaces",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E1B2E)
                )
                Text(
                    text = "Let ${profile.companionName} know if school, home, or your room felt calm, fun, or difficult today.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF78716C)
                )
            }
        }

        // List of 4 places
        places.forEach { place ->
            val currentScore = selectedRatings[place] ?: 3
            val currentNote = notesMap[place] ?: ""

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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(place.emoji, fontSize = 24.sp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = place.displayName,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E1B2E)
                            )
                        }

                        // 3 Score buttons
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(
                                1 to "😔 Hard",
                                2 to "😐 Okay",
                                3 to "😊 Great"
                            ).forEach { (score, label) ->
                                val isSelected = currentScore == score
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (isSelected) Color(0xFFEDE9FE) else Color(0xFFF5F5F4)
                                        )
                                        .clickable {
                                            selectedRatings = selectedRatings.toMutableMap().apply { put(place, score) }
                                        }
                                        .padding(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) Color(0xFF6B46C1) else Color(0xFF57534E)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = currentNote,
                        onValueChange = { newNote ->
                            notesMap = notesMap.toMutableMap().apply { put(place, newNote) }
                        },
                        placeholder = { Text("What happened here today? (optional)") },
                        textStyle = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )
                }
            }
        }

        // Save Button
        Button(
            onClick = {
                places.forEach { place ->
                    val score = selectedRatings[place] ?: 3
                    val note = notesMap[place]
                    viewModel.submitPlaceRating(place, score, note)
                }
                savedSuccess = true
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
        ) {
            Text("Save Places Check-In (+10 Sparkles ✨)", fontWeight = FontWeight.Bold)
        }

        if (savedSuccess) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFD1FAE5)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("✅", fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Saved! Your places insights help your family and care team support you.",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF065F46)
                    )
                }
            }
        }
    }
}
