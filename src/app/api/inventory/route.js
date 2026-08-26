import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/inventory - Fetch all inventory items
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY created_at DESC').all();
    const items = rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      stock: r.stock,
      unit: r.unit,
      location: r.location,
      unitPrice: r.unit_price,
      updatedAt: r.updated_at
    }));

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, category, stock, unit, location, unitPrice } = body;

    if (!name) return NextResponse.json({ error: '자재/장비명을 입력해 주세요.' }, { status: 400 });

    const invId = `INV-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO inventory (id, name, category, stock, unit, location, unit_price, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      invId,
      name,
      category || '케이블/배선',
      Number(stock) || 0,
      unit || '개',
      location || '본사 자재실',
      Number(unitPrice) || 0,
      dateStr
    );

    return NextResponse.json({ success: true, id: invId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/inventory - Update inventory stock or details
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, category, stock, unit, location, unitPrice } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const dateStr = new Date().toISOString().split('T')[0];
    const stmt = db.prepare(`
      UPDATE inventory
      SET name = ?, category = ?, stock = ?, unit = ?, location = ?, unit_price = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(name, category, Number(stock) || 0, unit, location, Number(unitPrice) || 0, dateStr, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory - Delete inventory item
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
