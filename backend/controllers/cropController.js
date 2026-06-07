const db = require('../config/database');

const getAllCrops = async (req, res, next) => {
  try {
    const [crops] = await db.query('SELECT * FROM crops WHERE is_active = 1 ORDER BY category, name');
    res.json({ success: true, crops });
  } catch (err) { next(err); }
};

const getCropById = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM crops WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Crop not found.' });
    res.json({ success: true, crop: rows[0] });
  } catch (err) { next(err); }
};

const createCrop = async (req, res, next) => {
  try {
    const { name, name_telugu, category, govt_price, unit, season } = req.body;
    if (!name || !govt_price) return res.status(400).json({ success: false, message: 'Name and price required.' });
    const [result] = await db.query(
      'INSERT INTO crops (name, name_telugu, category, govt_price, unit, season, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, name_telugu || null, category || 'cereal', govt_price, unit || 'quintal', season || 'all', req.user.id]
    );
    await db.query('INSERT INTO notifications (user_id, title, message, type) SELECT id, "New Crop MSP Added", ?, "info" FROM users WHERE role = "farmer"',
      [`${name} has been added with MSP ₹${govt_price}/quintal`]);
    res.status(201).json({ success: true, message: 'Crop added successfully.', id: result.insertId });
  } catch (err) { next(err); }
};

const updateCrop = async (req, res, next) => {
  try {
    const { name, name_telugu, category, govt_price, unit, season, is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM crops WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Crop not found.' });
    await db.query(
      'UPDATE crops SET name=?, name_telugu=?, category=?, govt_price=?, unit=?, season=?, is_active=?, updated_by=? WHERE id=?',
      [name || existing[0].name, name_telugu || existing[0].name_telugu, category || existing[0].category,
       govt_price || existing[0].govt_price, unit || existing[0].unit, season || existing[0].season,
       is_active !== undefined ? is_active : existing[0].is_active, req.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Crop updated successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getAllCrops, getCropById, createCrop, updateCrop };
