import React, { Component } from 'react'
import {
    Platform, StyleSheet, Text,
    View, WebView, PermissionsAndroid,
    requireNativeComponent, NativeModules, Modal,
    BackHandler, BackAndroid, Alert
} from 'react-native'
import DeviceInfo from 'react-native-device-info'
import firebase from 'react-native-firebase'
import PropTypes from 'prop-types';
import type { Notification, NotificationOpen } from 'react-native-firebase'
import { DotsLoader } from 'react-native-indicator'

const IMEI = require('react-native-imei')
const RCTCustomWebView = requireNativeComponent("RCTCustomWebView", App, WebView.extraNativeComponentConfig)
const { CustomWebViewManager } = NativeModules

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            Token: null,
            canGoBack: null,
            loading: true,
            permision: false,
        };
    }

    static propTypes = {
        ...WebView.propTypes,
        webviewRef: PropTypes.func
    }

    componentDidMount = async () => {

        this.checkPermission()

        BackHandler.addEventListener('hardwareBackPress', () => this.backAndroid())
    }

    backAndroid() {

        // Noted Fiyan
        // Kalo nambahin back page sebelumnya tambahin disini yah
        // jadi kalo this.state.canGoBack hasil nya true this.refs['WEBVIEW_REF'].goBack()
        // kalo false Close Aplikasi

        // !this.state.canGoBack ? 
        Alert.alert(
            '', //Title
            'Apakah anda ykin ingin keluar dari aplikasi ini ?',
            [
                { text: 'Tidak', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'Ya', onPress: () => BackAndroid.exitApp() },
            ],
            { cancelable: false }
        )
        // : this.refs['WEBVIEW_REF'].goBack();
        return true
    }

    async FireBaseConnection() {
        const enabled = await firebase.messaging().hasPermission();
        if (!enabled) {
            try {
                await firebase.messaging().requestPermission();
            } catch (error) {
                console.log(error);
            }
        }

        const Token = await firebase.messaging().getToken();
        if (Token) {
            this.setState({
                Token: Token
            });
        }

        const notificationListener = await firebase.notifications().onNotification((notification: Notification) => {

            notification.android.setChannelId('test-channel').android.setSmallIcon('ic_launcher');
            firebase.notifications().displayNotification(notification);

            const localNotification = new firebase.notifications.Notification({
                sound: 'default',
                show_in_foreground: true,
                show_in_background: true
            })
                .setNotificationId(notification.notificationId)
                .setTitle(notification.title)
                .setSubtitle(notification.subtitle)
                .setBody(notification.body)
                .setData(notification.data)
                .android.setChannelId('app_name')
                .android.setSmallIcon('ic_launcher')
                .android.setColor('#00e600')
                .android.setPriority(firebase.notifications.Android.Priority.High);

            firebase.notifications().displayNotification(localNotification).catch(err => console.error(err));
        });

        const notificationDisplayedListener = await firebase.notifications().onNotificationDisplayed((notification: Notification) => {

        });

        const notificationOpen = firebase.notifications().getInitialNotification();
        if (notificationOpen) {

            const action = notificationOpen.action;

            const notification = notificationOpen.notification;

            firebase.notifications().removeDeliveredNotification(notification.notificationId);
        }

        const notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {

            const action = notificationOpen.action;

            const notification = new firebase.notifications.Notification({
                sound: 'default',
                show_in_foreground: true,
                show_in_background: true
            })
                .setNotificationId(notificationOpen.notification.notificationId)
                .setTitle(notificationOpen.notification.title)
                .setSubtitle(notificationOpen.notification.subtitle)
                .setBody(notificationOpen.notification.body)
                .setData(notificationOpen.notification.data)
                .android.setChannelId('app_name')
                .android.setSmallIcon('ic_launcher')
                .android.setColor('#00e600')
                .android.setPriority(firebase.notifications.Android.Priority.High);

            firebase.notifications().removeDeliveredNotification(notification.notificationId);
        });
    }

    phoneData() {
        data = `
          document.getElementById('imei').value = '${IMEI.getImei()}';
          document.getElementById('token').value = '${this.state.Token}';
        `;
        return data;
    }

    getNativeConfig() {
        if (Platform.OS !== "android") {
            return null;
        }
        return {
            component: RCTCustomWebView,
            viewManager: CustomWebViewManager
        };
    }

    _updateWebViewHeight = (event) => {
        this.setState({ webViewHeight: parseInt(event.jsEvaluationValue), canGoBack: event.canGoBack, loading: event.loading });
    }

    checkPermission = () => {
        try {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)
                .then(response => {
                    response ? PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
                        .then(response => {
                            response ? PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
                                .then(response => { 
                                    response ? PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE)
                                        .then(response => {
                                            response ? this.setState({ permision: response }, () => {this.FireBaseConnection()}) : this.checkPermission()
                                        }) :this.checkPermission()
                                }) : this.checkPermission()
                        }) : this.checkPermission()
                })
        } catch (error) {
            console.log('error', error)
        }
    }

    render() {
        const { webviewRef, ...props } = this.props;

        return (
            <View style={{ flex: 1 }}>
                {this.state.permision && <View style={{ flex: 1 }}>
                    <WebView
                        ref={webviewRef}
                        {...props}
                        nativeConfig={this.getNativeConfig()}
                        source={{ uri: 'http://odpbckmjg.oppomobile.id/app/android' }}
                        style={styles.container}
                        javaScriptEnabledAndroid={true}
                        injectedJavaScript={this.phoneData()}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={false}
                        onNavigationStateChange={this._updateWebViewHeight}
                    />
                    <Loading
                        visible={this.state.loading}
                        text={'Harap tunggu sedang menyiapkan halaman'} />
                </View>}

            </View>
        );
    }
}

const Loading = props => (
    <Modal
        visible={props.visible}
        transparent
        animationType={'fade'}
        onRequestClose={() => null}>
        <View style={{ ...styles.overlay }}>
            <View style={{ ...styles.frame }}>
                <DotsLoader size={10} color={'green'} betweenSpace={5} />
                <Text style={{ ...styles.text }}>{props.text}</Text>
            </View>
        </View>
    </Modal>

)


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        backgroundColor: '#ffffffff',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frame: {
        backgroundColor: '#ffffffff',
        borderRadius: 3,
        paddingHorizontal: 16,
        paddingVertical: 16
    },
    text: {
        fontSize: 13,
        marginTop: 16
    }

})

