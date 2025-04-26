import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';

import TrackingScreen from './screens/TrackingScreen';

import ShareScreen from './screens/ShareScreen';

import ComparisonScreen from './screens/ComparisonScreen';

 

const Stack = createStackNavigator();

 

export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator initialRouteName="Login">

        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />

        <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Tour starten' }} />

        <Stack.Screen name="Share" component={ShareScreen} options={{ title: 'Tour teilen' }} />

        <Stack.Screen name="Compare" component={ComparisonScreen} options={{ title: 'Vergleich' }} />

      </Stack.Navigator>

    </NavigationContainer>

  );

}

 

// screens/LoginScreen.js

import React, { useState } from 'react';

import { View, Text, TextInput, Button, TouchableOpacity } from 'react-native';

import { auth } from '../firebaseConfig';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

import { GoogleSignin } from '@react-native-google-signin/google-signin';

 

GoogleSignin.configure({ webClientId: 'YOUR_WEB_CLIENT_ID' });

 

export default function LoginScreen({ navigation }) {

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

 

  const handleLogin = () => {

    signInWithEmailAndPassword(auth, email, password)

      .then(() => navigation.replace('Tracking'))

      .catch(console.error);

  };

 

  const handleGoogleLogin = async () => {

    const { idToken } = await GoogleSignin.signIn();

    const credential = GoogleAuthProvider.credential(idToken);

    signInWithCredential(auth, credential).then(() => navigation.replace('Tracking'));

  };

 

  return (

    <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#001f3f' }}>

      <Text style={{ fontSize: 32, color: '#fff', textAlign: 'center' }}>Login</Text>

      <TextInput placeholder="E-Mail" placeholderTextColor="#ccc" style={{ backgroundColor: '#012a5a', marginVertical: 8, padding: 12, borderRadius: 8, color: '#fff' }} value={email} onChangeText={setEmail} />

      <TextInput placeholder="Passwort" placeholderTextColor="#ccc" secureTextEntry style={{ backgroundColor: '#012a5a', marginVertical: 8, padding: 12, borderRadius: 8, color: '#fff' }} value={password} onChangeText={setPassword} />

      <Button title="Anmelden" color="#ff851b" onPress={handleLogin} />

      <Text style={{ color: '#fff', marginVertical: 16, textAlign: 'center' }}>oder</Text>

      <TouchableOpacity onPress={handleGoogleLogin} style={{ alignItems: 'center' }}>

        <Text style={{ color: '#fff' }}>Mit Google anmelden</Text>

      </TouchableOpacity>

    </View>

  );

}

 

// screens/TrackingScreen.js

import React, { useState, useEffect } from 'react';

import { View, Text, Button } from 'react-native';

import MapView, { Polyline } from 'react-native-maps';

import Geolocation from '@react-native-community/geolocation';

 

export default function TrackingScreen({ navigation }) {

  const [path, setPath] = useState([]);

  const [speed, setSpeed] = useState(0);

  const [avgSpeed, setAvgSpeed] = useState(0);

  let count = 0;

  useEffect(() => {

    const watchId = Geolocation.watchPosition(

      pos => {

        const { latitude, longitude, speed: s } = pos.coords;

        setPath(p => [...p, { latitude, longitude }]);

        setSpeed((s || 0) * 3.6);

        setAvgSpeed(prev => (prev * count + (s || 0) * 3.6) / ++count);

      },

      err => console.warn(err),

      { enableHighAccuracy: true, distanceFilter: 1 }

    );

    return () => Geolocation.clearWatch(watchId);

  }, []);

 

  return (

    <View style={{ flex: 1 }}>

      <MapView style={{ flex: 1 }} initialRegion={{ latitude: 48.137, longitude: 11.575, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>

        <Polyline coordinates={path} strokeColor="#ff851b" strokeWidth={4} />

      </MapView>

      <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(0,31,63,0.7)', padding: 16, borderRadius: 12 }}>

        <Text style={{ color: '#fff', fontSize: 18 }}>Aktuelles Tempo: {speed.toFixed(1)} km/h</Text>

        <Text style={{ color: '#fff', fontSize: 14 }}>Durchschnitt: {avgSpeed.toFixed(1)} km/h</Text>

        <Button title="Stoppen & speichern" color="#ff851b" onPress={() => navigation.navigate('Share', { path, avgSpeed })} />

      </View>

    </View>

  );

}

 

// screens/ShareScreen.js

import React, { useState } from 'react';

import { View, Text, TextInput, Button, TouchableOpacity, Linking } from 'react-native';

import MapView, { Polyline } from 'react-native-maps';

import { db } from '../firebaseConfig';

import { collection, addDoc } from 'firebase/firestore';

 

export default function ShareScreen({ route }) {

  const { path, avgSpeed } = route.params;

  const [name, setName] = useState('');

  const [visibility, setVisibility] = useState('public');

  const [link, setLink] = useState('');

 

  const handleShare = async () => {

    const doc = await addDoc(collection(db, 'tours'), { path, avgSpeed, name, visibility, createdAt: new Date() });

    const url = `https://yourapp.com/tour/${doc.id}`;

    setLink(url);

  };

 

  return (

    <View style={{ flex: 1, padding: 16, backgroundColor: '#001f3f' }}>

      <Text style={{ fontSize: 18, color: '#fff' }}>Meine Tour speichern</Text>

      <MapView style={{ height: 200, marginVertical: 16 }} initialRegion={{ latitude: path[0].latitude, longitude: path[0].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>

        <Polyline coordinates={path} strokeColor="#ff851b" strokeWidth={4} />

      </MapView>

      <TextInput placeholder="Tour-Name" placeholderTextColor="#ccc" style={{ backgroundColor: '#012a5a', padding: 12, borderRadius: 8, color: '#fff', marginBottom: 12 }} value={name} onChangeText={setName} />

      <Button title="Teilen" color="#ff851b" onPress={handleShare} />

      {link ? <TouchableOpacity onPress={() => Linking.openURL(link)}><Text style={{ color: '#ff851b', marginTop: 12 }}>{link}</Text></TouchableOpacity> : null}

    </View>

  );

}

 

// screens/ComparisonScreen.js

import React, { useState, useEffect } from 'react';

import { View, Text } from 'react-native';

import MapView, { Polyline } from 'react-native-maps';

 

export default function ComparisonScreen({ route }) {

  // TODO: load reference path from params or Firestore

  const referencePath = route.params.referencePath;

  const [currentPath, setCurrentPath] = useState([]);

  const [diffSpeed, setDiffSpeed] = useState(0);

 

  useEffect(() => {

    // similar tracking logic as TrackingScreen, but compute diff against reference

  }, []);

 

  return (

    <View style={{ flex: 1 }}>

      <MapView style={{ flex: 1 }}>

        <Polyline coordinates={referencePath} strokeColor="#0074D9" strokeWidth={4} />

        <Polyline coordinates={currentPath} strokeColors={[{offset: '0%', color: '#FF4136'},{offset: '100%', color: '#2ECC40'}]} strokeWidth={4} />

      </MapView>

      <View style={{ position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0,31,63,0.7)', padding: 8, borderRadius: 6 }}>

        <Text style={{ color: '#ff851b', fontWeight: 'bold' }}>{diffSpeed > 0 ? `+${diffSpeed.toFixed(1)} km/h` : `${diffSpeed.toFixed(1)} km/h`}</Text>

      </View>

    </View>

  );

}

 

/*

// iOS Native Module (Swift) at ios/RNGoogleMapsModule.swift

import Foundation

import GoogleMaps

 

@objc(RNGoogleMapsModule)

class RNGoogleMapsModule: NSObject {

  @objc

  func initializeSDK(_ apiKey: NSString) {

    GMSServices.provideAPIKey(apiKey as String)

  }

}

 

// Bridge Header at ios/RNGoogleMapsModuleBridge.m

#import <React/RCTBridgeModule.h>

 

@interface RCT_EXTERN_MODULE(RNGoogleMapsModule, NSObject)

RCT_EXTERN_METHOD(initializeSDK:(NSString *)apiKey)

@end

*/
