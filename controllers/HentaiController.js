import { ChapterModel, HentaiModel } from "../models/HentaiModel.js";
import mongoose, { isValidObjectId } from "mongoose";
// Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
class HentaiController {
    // Cadastrar/Criar Página de um Mangá
    static async create(req, res) {
        const { title, description, mangaka, tags, status, format, titleChapter, subtitleChapter, } = req.body;
        // Upload de Imagens
        let image = "";
        if (req.file) {
            if ("key" in req.file) {
                // Estamos usando o armazenamento S3
                if (typeof req.file.key === "string") {
                    image = req.file.key;
                }
            }
            else {
                // Estamos usando o armazenamento local
                if (typeof req.file.filename === "string") {
                    image = req.file.filename;
                }
            }
        }
        // Validações
        if (!title) {
            res.status(422).json({ message: "O título é obrigatório!" });
            return;
        }
        const hentaiExist = await HentaiModel.findOne({
            title: title,
        });
        if (hentaiExist) {
            res.status(422).json({ message: "Hentai já cadastrado!" });
            return;
        }
        if (!description) {
            res.status(422).json({ message: "A descrição é obrigatória!" });
            return;
        }
        if (!mangaka) {
            res.status(422).json({
                message: "O nome do Mangaka é obrigatório!",
            });
            return;
        }
        if (!tags) {
            res.status(422).json({ message: "A tag é obrigatória!" });
            return;
        }
        // Divide a string de tags com base em vírgulas ou ponto e vírgula
        const tagArray = tags.split(/[;,]+/);
        // Remove espaços em branco em excesso de cada tag e filtra tags vazias
        const cleanedTags = tagArray
            .map((tag) => tag.trim()) // Especifica o tipo como string
            .filter((tag) => tag !== ""); // Especifica o tipo como string
        if (!status) {
            res.status(422).json({
                message: "O status do projeto é obrigatório!",
            });
            return;
        }
        if (!format) {
            res.status(422).json({ message: "O formato é obrigatório!" });
            return;
        }
        if (image.length === 0) {
            res.status(422).json({ message: "A imagem é obrigatória!" });
            return;
        }
        // Pegar o Administrador responsável pelo cadastro do Mangá
        const token = getToken(req);
        const user = await getUserByToken(token);
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado" });
            return;
        }
        const chapters = [];
        if (titleChapter && subtitleChapter) {
            const chapterId = new mongoose.Types.ObjectId();
            chapters.push({
                _id: chapterId,
                titleChapter: titleChapter,
                subtitleChapter: subtitleChapter,
            });
        }
        // Criar uma nova Página de Hentai
        const hentai = new HentaiModel({
            title: title,
            description: description,
            mangaka: mangaka,
            tags: cleanedTags,
            status: status,
            format: format,
            image,
            user: {
                _id: user._id,
            },
            chapters: chapters,
        });
        // Se tags for um array vazio, adicione a nova string
        if (Array.isArray(cleanedTags) && cleanedTags.length === 0) {
            cleanedTags.push("nova string");
        }
        try {
            const newHentai = await hentai.save();
            res.status(201).json({
                message: "Hentai Cadastrado com Sucesso!",
                newHentai,
            });
        }
        catch (err) {
            res.status(500).json({ message: err });
        }
    }
    static async getAll(req, res) {
        const hentais = await HentaiModel.find().sort("-createdAt");
        res.status(200).json({ hentais: hentais });
        return;
    }
    static async getHentaiById(req, res) {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(422).json({ message: "Id inválido" });
            return;
        }
        // Verificar se o Mangá existe
        const hentai = await HentaiModel.findOne({ _id: id });
        if (!hentai) {
            res.status(404).json({ message: "Hentai não encontrado" });
            return;
        }
        res.status(200).json({ hentai: hentai });
        return;
    }
    // // remove a pet
    static async removeHentaiById(req, res) {
        const { id } = req.params;
        // Verificar se o ID é válido
        if (!isValidObjectId(id)) {
            res.status(422).json({ message: "ID inválido!" });
            return;
        }
        // Verificar se o Mangá Existe
        const hentai = await HentaiModel.findOne({ _id: id });
        if (!hentai) {
            res.status(404).json({ message: "Hentai não encontrado!" });
            return;
        }
        // Verificar o Administrador que cadastrou o Mangá
        const token = getToken(req);
        const user = await getUserByToken(token);
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado" });
            return;
        }
        if (hentai.user._id.toString() !==
            user._id.toString()) {
            res.status(401).json({
                message: "Acesso não autorizado para esta solicitação.",
            });
            return;
        }
        await HentaiModel.findByIdAndRemove(id);
        res.status(200).json({ message: "Hentai removido com sucesso!" });
    }
    static async updateHentai(req, res) {
        const { id } = req.params;
        const { title, description, mangaka, tags, status, format } = req.body;
        // Upload de Imagens
        let image = "";
        if (req.file) {
            if ("key" in req.file) {
                // Estamos usando o armazenamento S3
                if (typeof req.file.key === "string") {
                    image = req.file.key;
                }
            }
            else {
                // Estamos usando o armazenamento local
                if (typeof req.file.filename === "string") {
                    image = req.file.filename;
                }
            }
        }
        const updateData = {};
        // Verificar se o Mangá Existe
        const hentai = await HentaiModel.findOne({ _id: id });
        if (!hentai) {
            res.status(404).json({ message: "Hentai não encontrado!" });
            return;
        }
        // Verificar o Administrador que cadastrou o Mangá
        const token = getToken(req);
        const user = await getUserByToken(token);
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado" });
            return;
        }
        if (hentai.user._id.toString() !==
            user._id.toString()) {
            res.status(401).json({
                message: "Acesso não autorizado para esta solicitação.",
            });
            return;
        }
        // Validações
        if (!title) {
            res.status(422).json({ message: "O título é obrigatório!" });
            return;
        }
        else {
            updateData.title = title;
        }
        if (!description) {
            res.status(422).json({ message: "A descrição é obrigatória!" });
            return;
        }
        else {
            updateData.description = description;
        }
        if (!mangaka) {
            res.status(422).json({
                message: "O nome do Mangaka é obrigatório!",
            });
            return;
        }
        else {
            updateData.mangaka = mangaka;
        }
        if (!tags) {
            res.status(422).json({ message: "A tag é obrigatória!" });
            return;
        }
        else {
            // Dividir a string de tags com base em vírgulas ou ponto e vírgula e limpar espaços em branco
            const tagArray = tags.split(/[;,]+/).map((tag) => tag.trim());
            // Filtrar tags vazias
            updateData.tags = tagArray.filter((tag) => tag !== "");
        }
        if (!status) {
            res.status(422).json({
                message: "O status do projeto é obrigatório!",
            });
            return;
        }
        else {
            updateData.status = status;
        }
        if (!format) {
            res.status(422).json({ message: "O formato é obrigatório!" });
            return;
        }
        else {
            updateData.format = format;
        }
        if (image && image.length > 0) {
            updateData.image = image;
        }
        await HentaiModel.findByIdAndUpdate(id, updateData);
        res.status(200).json({ message: "Hentai atualizado com sucesso!" });
    }
    static async createChapters(req, res) {
        const { id } = req.params;
        const { titleChapter, subtitleChapter } = req.body;
        const imagesChapter = req.files;
        // Verificar se o Mangá Existe
        const hentai = await HentaiModel.findOne({ _id: id });
        if (!hentai) {
            res.status(404).json({ message: "Hentai não encontrado!" });
            return;
        }
        // Verificar o Administrador que cadastrou o Mangá
        const token = getToken(req);
        const user = await getUserByToken(token);
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado" });
            return;
        }
        if (hentai.user._id.toString() !==
            user._id.toString()) {
            res.status(401).json({
                message: "Acesso não autorizado para esta solicitação.",
            });
            return;
        }
        // Validações
        if (!titleChapter || !subtitleChapter) {
            res.status(422).json({
                message: "O título e o subtitulo do capítulo são obrigatórios!",
            });
            return;
        }
        const chapterId = new mongoose.Types.ObjectId();
        const chapter = new ChapterModel({
            _id: chapterId,
            titleChapter: titleChapter,
            subtitleChapter: subtitleChapter,
            imagesChapter: [],
        });
        // Percorrer o Array de Images e adicionar cada filename ao capítulo
        imagesChapter.forEach((imageChapter) => {
            // Adaptar a lógica de manipulação de imagens de acordo com a sua necessidade
            let image = "";
            if ("key" in imageChapter) {
                // Estamos usando o armazenamento S3
                if (typeof imageChapter.key === "string") {
                    image = imageChapter.key;
                }
            }
            else {
                // Estamos usando o armazenamento local
                if (typeof imageChapter.filename === "string") {
                    image = imageChapter.filename;
                }
            }
            // Adicionar a imagem ao capítulo
            chapter.imagesChapter.push(image);
        });
        hentai.chapters.push(chapter);
        try {
            await hentai.save();
            res.status(200).json({ message: "Capítulo criado com sucesso!" });
        }
        catch (err) {
            res.status(500).json({ message: err });
        }
    }
}
export default HentaiController;
