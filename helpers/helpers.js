import nodemailer from "nodemailer";
import _ from 'underscore';
// import BlockUser from '../app/models/BlockUser.js';
import ConversationDetail from '../app/models/Participant.js';
import participant from '../app/models/Participant.js';
import connection from '../config/db.js';

function validateUsername(username) {
    /* 
      Usernames can only have: 
      - Lowercase Letters (a-z) 
      - Numbers (0-9)
      - Dots (.)
      - Underscores (_)
    */
    const res = /^[a-z0-9_\.]+$/.exec(username);
    const valid = !!res;
    return valid;
}

function validateEmail(email) {
    let pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(email);
}

async function getGroupsIds(id) {
    try {
        const participants = await participant.findAll({
          attributes: [[connection.fn('DISTINCT', connection.col('conversation_id')), 'conversation_id']],
          where: {
            user_id: id,
          },
          raw: true,
        });

        return participants.map((participant) => `group-${participant.conversation_id}`);
    } catch (error) {
        console.error(error);
        return null;
    }
}

function regexSearch(query) {
    let search = '.*' + query + '.*';
    let value = new RegExp(["^", search, "$"].join(""), "i");
    return value;
}

function distance(lat1, lon1, lat2, lon2, unit) {

    var radlat1 = Math.PI * lat1 / 180
    var radlat2 = Math.PI * lat2 / 180
    var theta = lon1 - lon2
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") { dist = dist * 1.609344 }
    if (unit == "N") { dist = dist * 0.8684 }
    return dist
}

function sort(arr, property, sortType) {
    if (!Array.isArray(arr)) throw new Error(`Expected array in arr but got ${typeof arr}`);
    if (typeof property !== "string") throw new Error(`Expected string in property but got ${typeof property}`);
    if (typeof sortType !== "number") throw new Error(`Expected number in sortType but got ${typeof sortType}`);
    let result = _.sortBy(arr, property);
    if (sortType < 0) result = result.reverse();
    return result;
}

function filterCoordinates(poslat, poslng, range_in_meter, data) {
    var cord = [];
    for (var i = 0; i < data.length; i++) {
        if (distance(poslat, poslng, data[i].location.lat, data[i].location.lng, "K") <= range_in_meter) {
            cord.push(data[i]._id);
        }
    }
    return cord;
}

function sendResetPasswordEmail(num, email, name, callback) {
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    var mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: "Code for reset password",
        html: " Hi <strong>" + `${name}` + "</strong> <br /><br /> Your verification code is <strong>" + `${num}` + "</strong>. <br /> Enter this code in our app to reset your password.",
    };
    return transporter.sendMail(mailOptions, callback)
}

function notificationHelper(fcmToken, title, body, data, payloadData, daterId) {
    var fcm = new FCM(process.env.FCM_KEY);
    var message = {
        to: fcmToken,
        collapse_key: 'your_collapse_key',

        notification: {
            title: title,
            body: body
        },
        data: data
    };

    notifications.create({
        daterId: daterId,
        title: title,
        body: body,
        data: payloadData,
        readStatus: 0
    });

    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}

function paginate(records, page = 1, limit = 50, key = "result") {
    page = isNaN(parseInt(page)) ? 1 : parseInt(page),
        limit = isNaN(parseInt(limit)) ? 1 : parseInt(limit);

    const results = {};
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    if (endIndex < records.length) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    results.totalPages = {
        page: Math.ceil(records.length / limit),
        limit: limit,
        totalRecords: records.length
    };

    // results.result = records.slice(startIndex, endIndex);
    results[key] = records.slice(startIndex, endIndex);
    return results;
}

// const checkUserIsBlock = async (userId, reciever_id) => {
//     try {
//         const data = await BlockUser.findOne({
//             where: { 
//                 user_id: reciever_id,
//                 block_user_id: userId,
//                 status: 1,
//             }
//         });
//         if (!data || data.length == 0) {
//             return 0;
//         }
//         return 1;
//     } catch (error) {
//         console.error('Error fetching user:', error);
//         throw error;
//     }
// };

const checkUserIsMute = async (userId, conversation_id) => {
    try {
        const data = await ConversationDetail.findOne({
            where: { 
                user_id: userId,
                recordable_id: conversation_id,
                recordable_type: 'conversation',
                is_mute: 1,
            }
        });
        if (!data || data.length == 0) {
            return 0;
        }
        return 1;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

export default {
    validateUsername,
    validateEmail,
    regexSearch,
    filterCoordinates,
    sendResetPasswordEmail,
    notificationHelper,
    paginate,
    sort,
    // checkUserIsBlock,
    checkUserIsMute,
    uppercaseFirst,
    getGroupsIds
}