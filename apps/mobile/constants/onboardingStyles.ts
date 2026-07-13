import { StyleSheet } from "react-native";
import { Colors } from "./theme";

export const createOnboardingStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 24,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabItem: {
    borderBottomColor: theme.primary,
  },
  formSection: {
    gap: 16,
    marginBottom: 32,
  },
  mediaGrid: {
    gap: 20,
    marginBottom: 32,
  },
  mediaCard: {
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.border,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  errorText: {
    color: "#D92D20",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
  },
  // Pending specific
  pendingContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    marginBottom: 40,
    alignItems: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: 24,
  },
  modalGrid: {
    flexDirection: "row",
    gap: 40,
  },
  modalOption: {
    alignItems: "center",
  },
  rejectionBanner: {
    backgroundColor: "#FCEBEB",
    padding: 16,
    marginHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FEE4E2",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  }
});
