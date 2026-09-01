package com.example.nest.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        ChildProfileEntity::class,
        MoodEntryEntity::class,
        PlaceRatingEntity::class,
        PatternAlertEntity::class,
        PointsLedgerEntity::class,
        ConversationTurnEntity::class,
        CareTeamMessageEntity::class,
        TherapyActivityEntity::class,
        ActivityLogEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class NestDatabase : RoomDatabase() {
    abstract fun nestDao(): NestDao

    companion object {
        @Volatile
        private var INSTANCE: NestDatabase? = null

        fun getInstance(context: Context): NestDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    NestDatabase::class.java,
                    "nest_wellness_database"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
