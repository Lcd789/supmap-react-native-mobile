import { Text, View, StyleSheet} from "react-native";
import { Link } from "expo-router";


export default function Home() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Home</Text>
            <Link href={"/login"} style={styles.linkButton}>
              Login
            </Link>
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#25292e",
    },
    text: {
        color: "white",
    },
    imageContainer: {
        flex : 1,
    },
    linkButton: {
      fontSize: 20,
      textDecorationLine: "underline",
      color: "blue",
    },
});