import { Content } from "../models/init.js";

const getContent = async (req, res) => {
    try {
        const contents = await Content.findAll({
            attributes: ['id', 'name', 'slug', 'media', 'created_at', 'updated_at']
        });
        return res.responseInstance.handle({ 'contents': contents }, 200);
    } catch (err) {
        return res.responseInstance.handle(null, 500, ["An unexpected error occurred while proceeding your request."], err.message);
    }
};

const singleContent = async (req, res) => {
    try {
        const slug      = req.params.slug ?? 'privacy-policy';
        const content   = await Content.findOne({
            attributes: ['id', 'name', 'slug', 'media', 'description', 'created_at', 'updated_at'],
            where:{
                slug: slug
            }
        });
        return res.responseInstance.handle({ 'content': content }, 200);
    } catch (err) {
        return res.responseInstance.handle(null, 500, ["An unexpected error occurred while proceeding your request."], err.message);
    }
};

export default {
    getContent,
    singleContent
}