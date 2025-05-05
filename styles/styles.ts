// globalStyles.ts
import { StyleSheet, Platform } from 'react-native';

const primaryColor = "#2196F3";
const backgroundColor = "#F7F7F7";
const cardBackground = "#FFFFFF";
const textColor = "#333";
const borderColor = "#ddd";
const borderRadius = 8;
const padding = 16;
const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
};

/* ===========================
   Home (index.tsx) styles
   =========================== */
export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: backgroundColor,
    },
    reverseButton: {
        padding: 8,
        borderRadius,
        backgroundColor: cardBackground,
        ...shadow,
    },
    errorContainer: {
        position: "absolute",
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: cardBackground,
        padding: 10,
        borderRadius,
        ...shadow,
    },
    errorText: {
        color: "red",
        textAlign: "center",
    },
    // Nouveaux styles pour index.tsx
    floatingButton: {
        position: "absolute",
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: primaryColor,
        alignItems: "center",
        justifyContent: "center",
        ...shadow,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

/* ===========================
   Login (login.tsx) styles
   =========================== */
export const loginStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: backgroundColor,
        padding,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: textColor,
    },
    input: {
        borderWidth: 1,
        borderColor,
        padding: 10,
        borderRadius,
        marginBottom: 10,
        backgroundColor: cardBackground,
    },
    inputPassword: {
        flex: 1,
        borderWidth: 1,
        borderColor,
        padding: 10,
        borderRadius,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor,
        borderRadius,
        paddingRight: 10,
        marginBottom: 10,
        backgroundColor: cardBackground,
    },
    toggleButton: {
        padding: 10,
    },
    error: {
        color: "red",
        fontSize: 14,
        marginBottom: 10,
    },
    forgotpass: {
        fontSize: 14,
        textDecorationLine: "underline",
        color: primaryColor,
        textAlign: "right",
    },
    linkButton: {
        fontSize: 20,
        textDecorationLine: "underline",
        color: primaryColor,
    },
});


export const Colors = {
    primary:    '#0057FF',
    background: '#F0F2F5',
    card:       '#FFFFFF',
    text:       '#1D1D1D',
    subtext:    '#6E6E6E',
    border:     '#E0E0E0',
    success:    '#43A047',
    danger:     '#E53935',
  };
  
  const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };
  
  const Border = {
    radius: 24,
    width:  1,
  };
  
  const Typography = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  };
  
  const Shadow = Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius:  8,
    },
    android: { elevation: 6 },
  });
  
  export const profileStyles = StyleSheet.create({
    // ── Container général ───────────────────────────────────────
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollContent: {
      paddingBottom: Spacing.lg,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    // ── Header & avatar ────────────────────────────────────────
    header: {
      backgroundColor:        Colors.primary,
      paddingVertical:        Spacing.xl,
      alignItems:             'center',
      borderBottomLeftRadius:  Border.radius,
      borderBottomRightRadius: Border.radius,
    },
    avatarWrapper: {
      marginTop:    -(Spacing.xl * 0.75), // -24
      width:         Spacing.xl * 1.5,     // 48
      height:        Spacing.xl * 1.5,     // 48
      borderRadius: (Spacing.xl * 1.5) / 2,
      overflow:      'hidden',
      borderWidth:   Border.width,
      borderColor:  Colors.card,
      ...Shadow,
    },
    avatar: {
      width:  '100%',
      height: '100%',
    },
    userName: {
      marginTop:  Spacing.sm,
      fontSize:   Typography.xxl,
      fontWeight: '700',
      color:      Colors.card,
    },
    userRole: {
      fontSize:  Typography.sm,
      color:     Colors.card,
      marginTop: Spacing.xs,
    },
  
    // ── Main Tabs (chevauchent le header) ───────────────────────
    tabsWrapper: {
      flexDirection:  'row',
      justifyContent: 'center',
      marginTop:     -Spacing.lg, // descendre sous le header
      zIndex:         10,
      elevation:      10,
    },
    tabContainer: {
      flexDirection:   'row',
      backgroundColor: '#ECECEC',
      borderRadius:    Border.radius,
      overflow:        'hidden',
      marginHorizontal: Spacing.md,
    },
    tabButton: {
      flex:            1,
      alignItems:      'center',
      paddingVertical: Spacing.sm,
    },
    tabButtonActive: {
      backgroundColor: Colors.card,
    },
    tabText: {
      fontSize: Typography.md,
      color:    Colors.card,
    },
    tabTextActive: {
      fontSize:   Typography.md,
      fontWeight: '600',
      color:      Colors.subtext,
    },
  
    // ── Sub-Tabs (Activities) ───────────────────────────────────
    subTabContainer: {
      paddingVertical:   Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    subTabButton: {
      marginRight:      Spacing.sm,
      paddingVertical:   Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius:      Border.radius / 1.5,
      backgroundColor:   Colors.card,
      borderWidth:       Border.width,
      borderColor:       Colors.border,
    },
    subTabButtonActive: {
      backgroundColor: Colors.primary,
    },
    subTabText: {
      fontSize: Typography.sm,
      color:    Colors.text,
    },
    subTabTextActive: {
      color:      Colors.card,
      fontWeight: '600',
    },
  
    // ── Sections & titres ─────────────────────────────────────
    section: {
      backgroundColor:  Colors.card,
      borderRadius:     Border.radius / 1.5,
      padding:          Spacing.md,
      marginHorizontal: Spacing.md,
      marginBottom:     Spacing.md,
      ...Shadow,
    },
    sectionTitle: {
      fontSize:     Typography.lg,
      fontWeight:   '600',
      color:        Colors.primary,
      marginBottom: Spacing.sm,
    },
  
    // ── Items “Personal Info” ───────────────────────────────────
    itemCard: {
      backgroundColor: Colors.card,
      borderRadius:    Border.radius / 1.5,
      padding:         Spacing.md,
      marginBottom:    Spacing.md,
      borderWidth:     Border.width,
      borderColor:     Colors.border,
    },
    itemLabel: {
      fontSize: Typography.sm,
      color:    Colors.subtext,
    },
    itemValue: {
      fontSize:   Typography.md,
      color:      Colors.text,
      marginTop:  Spacing.xs,
    },
  
    // ── Bouton “Save” uniquement ───────────────────────────────
    actionRow: {
      flexDirection:    'row',
      justifyContent:   'center',
      paddingHorizontal: Spacing.md,
      marginTop:        Spacing.md,
    },
    actionButton: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'center',
      paddingVertical:   Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius:      Border.radius / 1.5,
      backgroundColor:   Colors.success,
      ...Shadow,
    },
    saveButton: {
      backgroundColor: Colors.success,
    },
    actionText: {
      fontSize:   Typography.md,
      fontWeight: '600',
      color:      Colors.card,
      marginLeft: Spacing.sm,
    },
  
    // ── Erreurs & loader ───────────────────────────────────────
    errorText: {
      color:         Colors.danger,
      textAlign:     'center',
      marginVertical: Spacing.sm,
    },
  });
/* ===========================
   Register (register.tsx) styles
   =========================== */
export const registerStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: backgroundColor,
        padding,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: textColor,
    },
    input: {
        borderWidth: 1,
        borderColor,
        padding: 10,
        borderRadius,
        marginBottom: 10,
        backgroundColor: cardBackground,
    },
    error: {
        color: "red",
        marginBottom: 10,
    },
    linkButton: {
        fontSize: 20,
        textDecorationLine: "underline",
        color: primaryColor,
    },
});

/* ===========================
   Settings (settings.tsx) styles
   =========================== */
export const settingsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        padding,
    },
    // Nouveaux styles pour settings.tsx
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: textColor,
        marginBottom: 16,
    },
    content: {
        flex: 1,
        padding,
        backgroundColor: cardBackground,
        borderRadius,
        ...shadow,
    },
    button: {
        backgroundColor: primaryColor,
        padding: 12,
        borderRadius,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#eee",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    text: {
        color: textColor,
        fontSize: 18,
    },
});

/* ===========================
   Button (Button.tsx) styles
   =========================== */
export const buttonStyles = StyleSheet.create({
    buttonContainer: {
        width: "90%",
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        padding: 3,
        backgroundColor: primaryColor,
        borderRadius,
        ...shadow,
        alignSelf: "center",
    },
    buttonLabel: {
        color: "#fff",
        fontSize: 16,
    },
});

/* ===========================
   ImageViewer (ImageViewer.tsx) styles
   =========================== */
export const imageViewerStyles = StyleSheet.create({
    imageContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: "hidden",
    },
});

/* ===========================
   RouteInfo (RouteInfo.tsx) styles
   =========================== */
export const routeInfoStyles = StyleSheet.create({
    routeInfoContainer: {
        position: "absolute",
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: cardBackground,
        borderRadius,
        padding: 15,
        ...shadow,
        zIndex: 1000
    },
    routeInfoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    routeInfoTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: textColor,
    },
    routeInfoSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    stepsContainer: {
        overflow: "hidden",
        marginTop: 10,
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
    },
    stepIcon: {
        marginRight: 10,
    },
    stepTextContainer: {
        flex: 1,
    },
    stepInstruction: {
        fontSize: 14,
        color: textColor,
    },
    stepDistance: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
});

/* ===========================
   RouteMap (RouteMap.tsx) styles
   =========================== */
export const routeMapStyles = StyleSheet.create({
    map: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    location: {
        position: "absolute",
        bottom: 160,
        right: 20,
        backgroundColor: cardBackground,
        height: 50,
        width: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        ...shadow,
    },
});

/* ===========================
   SearchBar (SearchBar.tsx) styles
   =========================== */
export const searchBarStyles = StyleSheet.create({
    searchContainer: {
        position: "absolute",
        top: 40,
        left: 10,
        right: 10,
        backgroundColor: cardBackground,
        borderRadius,
        padding: 10,
        zIndex: 1,
        ...shadow,
        flexDirection: "column",
    },
    inputsContainer: {
        maxHeight: 300,
        width: "100%",
    },
    input: {
        borderWidth: 1,
        borderColor,
        borderRadius : 4,
        padding: 8,
        marginVertical: 5,
        backgroundColor: cardBackground,
        flex: 1,
    },
    addWaypointButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        backgroundColor: cardBackground,
        borderRadius,
        ...shadow,
    },
    addWaypointText: {
        color: primaryColor,
        marginLeft: 8,
    },
    deleteWaypoint: {
        backgroundColor: "#D32F2F",
        justifyContent: "center",
        alignItems: "center",
        width: 70,
        height: "100%",
    },
    searchButton: {
        backgroundColor: primaryColor,
        padding: 12,
        borderRadius: 4,
        alignItems: "center",
    },
    searchButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    reverseButton: {
        padding: 8,
        borderRadius,
        backgroundColor: cardBackground,
        ...shadow,
    },
    waypointContainer: {
        flexDirection: "row",
        alignItems: "center",
    },

    deleteWaypointIcon: {
        marginLeft: 8,
    },
    waypointList: {
        flexGrow: 1,
        width: "100%",
    },
    buttonContainer: {
        flexDirection: "row",
        marginVertical: 5,
        alignItems: "center",
    },
    suggestionList: {
        maxHeight: 150,
        backgroundColor: "#fff",
        borderRadius: 8,
        elevation: 3,
        marginBottom: 10,
      },
      
      suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
      },
      
});

/* ===========================
   TransportModeSelector (TransportModeSelector.tsx) styles
   =========================== */
export const transportModeStyles = StyleSheet.create({
    transportMode: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 10,
    },
    modeButton: {
        padding: 8,
        borderRadius,
        backgroundColor: "#eee",
    },
    selectedMode: {
        backgroundColor: primaryColor,
    },
});
