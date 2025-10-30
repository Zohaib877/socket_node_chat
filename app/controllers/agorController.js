import pkg from 'agora-token';
const { RtcRole, RtcTokenBuilder } = pkg;

const getAgoraToken = async (req, res) => {
    try {
        let role = req.params.role;
        const userId = req.params.id;
        console.log('====================================');
        console.log('Agora Token Request', userId, role);
        console.log('====================================');
        const APP_ID = process.env.APP_ID;
        const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
        res.header('Access-Control-Allow-Origin', '*');

        const channelName = String(userId);
        let uid = 0;
        let expireTime = 360000;
        if (req.params.role === 'publisher') {
            role = RtcRole.PUBLISHER;
        } else {
            role = RtcRole.SUBSCRIBER
        }
        console.log('====================================');
        console.log("channelName", channelName);
        console.log('====================================');
        const currentTime = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTime + expireTime;
        let token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
        console.log('====================================');
        console.log('Agora Token', token);
        console.log('====================================');
        return res.responseInstance.handle({ 'rtcToken': token }, 200);
    } catch (err) {
        return res.responseInstance.handle(null, 500, "An unexpected error occurred while proceeding your request.", err.message);
    }
};

export default {
    getAgoraToken,
}