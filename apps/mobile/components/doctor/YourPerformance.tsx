import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedCard } from "../medconnect/MedCard";
import { MedText } from "../medconnect/MedText";

interface Review {
  id: number;
  rating: number;
  comment: string;
  patient?: {
    patientProfile?: {
      fullName: string;
    };
  };
}

interface YourPerformanceProps {
  rating: number | string;
  totalReviews: number;
  reviews: Review[];
  loadingReviews: boolean;
  theme: any;
}

export const YourPerformance: React.FC<YourPerformanceProps> = ({
  rating,
  totalReviews,
  reviews,
  loadingReviews,
  theme,
}) => {
  const anonymizeName = (fullName: string) => {
    if (!fullName) return "Patient";
    const parts = fullName.split(" ");
    if (parts.length < 2) return fullName;
    return `${parts[0]} ${parts[1][0]}.`;
  };

  return (
    <MedCard style={[styles.ratingCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={styles.headerRow}>
        <MedText variant="metadata" color={theme.muted} style={styles.headerTitle}>YOUR PERFORMANCE</MedText>
        <Ionicons name="star" size={20} color="#F59E0B" />
      </View>
      <View style={styles.ratingRow}>
        <MedText style={[styles.ratingAmount, { color: theme.text }]}>{rating || "0.0"}</MedText>
        <MedText variant="metadata" color={theme.muted} style={styles.reviewsCount}>
          ★ ({totalReviews || 0} reviews)
        </MedText>
      </View>
      
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      
      <MedText variant="metadata" color={theme.muted} style={styles.feedbackTitle}>
        LATEST PATIENT FEEDBACK
      </MedText>

      {loadingReviews ? (
        <ActivityIndicator color={theme.primary} size="small" style={{ marginVertical: 12 }} />
      ) : reviews.length > 0 ? (
        reviews.slice(0, 3).map((rev) => (
          <View key={rev.id} style={[styles.miniReview, { borderBottomColor: theme.border + "30" }]}>
            <View style={styles.miniReviewHeader}>
              <MedText variant="metadata" style={styles.patientName}>
                {anonymizeName(rev.patient?.patientProfile?.fullName || "")}
              </MedText>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons 
                    key={s} 
                    name="star" 
                    size={10} 
                    color={s <= rev.rating ? "#F59E0B" : theme.border} 
                  />
                ))}
              </View>
            </View>
            <MedText variant="metadata" color={theme.textSecondary || theme.text} numberOfLines={2}>
              {rev.comment}
            </MedText>
          </View>
        ))
      ) : (
        <MedText variant="metadata" color={theme.muted} style={{ fontStyle: "italic" }}>
          No feedback received yet.
        </MedText>
      )}
    </MedCard>
  );
};

const styles = StyleSheet.create({
  ratingCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  ratingAmount: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
  },
  reviewsCount: {
    marginLeft: 8,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  feedbackTitle: {
    marginBottom: 12,
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  miniReview: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  miniReviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  patientName: {
    fontWeight: "600",
  },
});
