const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://salessuite_app:mon0715@72.61.17.146:5432/salessuite"
    });

    try {
        await client.connect();
        // find company
        const comp = await client.query(`SELECT id FROM companies LIMIT 1`);
        if (!comp.rows.length) { console.log('No company'); return; }
        const cId = comp.rows[0].id;
        console.log('Company:', cId);

        const query = `
      SELECT 
        cu.id as rep_id,
        u.full_name as rep_name,
        COALESCE(o_counts.orders_count, 0)::int as orders_count,
        COALESCE(o_counts.total_sales, 0)::float as total_sales,
        COALESCE(a_counts.attendance_count, 0)::int as attendance_count,
        COALESCE(l_counts.leads_count, 0)::int as leads_count,
        COALESCE(v_counts.visit_count, 0)::int as visit_count,
        COALESCE(v_counts.compliance_count, 0)::int as compliance_count,
        COALESCE(v_counts.compliance_approved_count, 0)::int as compliance_approved_count,
        COALESCE(e_counts.expenses_sum, 0)::float as expenses_sum,
        COALESCE(act.walking_ms, 0)::bigint as walking_ms,
        COALESCE(act.driving_ms, 0)::bigint as driving_ms,
        COALESCE(act.still_ms, 0)::bigint as still_ms,
        COALESCE(act.distance_km, 0)::float as distance_km,
        al.clock_in_at as last_clock_in,
        al.clock_out_at as last_clock_out,
        (al.clock_in_at IS NOT NULL AND al.clock_out_at IS NULL) as is_on_duty
      FROM company_users cu
      JOIN users u ON cu.user_id = u.id
      -- Latest attendance log
      LEFT JOIN LATERAL (
        SELECT clock_in_at, clock_out_at
        FROM attendance_logs
        WHERE rep_company_user_id = cu.id
        ORDER BY clock_in_at DESC
        LIMIT 1
      ) al ON true
      LEFT JOIN (
        SELECT placed_by_company_user_id, COUNT(*) as orders_count, SUM(total_amount) as total_sales
        FROM orders
        WHERE company_id = $1 AND placed_at >= $2 AND placed_at <= $3
        GROUP BY placed_by_company_user_id
      ) o_counts ON o_counts.placed_by_company_user_id = cu.id
      LEFT JOIN (
        SELECT rep_company_user_id, COUNT(*) as attendance_count
        FROM attendance_logs
        WHERE company_id = $1 AND clock_in_at >= $2 AND clock_in_at <= $3
        GROUP BY rep_company_user_id
      ) a_counts ON a_counts.rep_company_user_id = cu.id
      LEFT JOIN (
        SELECT created_by_company_user_id, COUNT(*) as leads_count
        FROM leads
        WHERE company_id = $1 AND created_at >= $2 AND created_at <= $3
        GROUP BY created_by_company_user_id
      ) l_counts ON l_counts.created_by_company_user_id = cu.id
      LEFT JOIN (
        SELECT 
          rep_company_user_id, 
          COUNT(*) as visit_count,
          SUM(CASE WHEN exception_reason IS NOT NULL THEN 1 ELSE 0 END) as compliance_count,
          SUM(CASE WHEN exception_reason IS NOT NULL AND approved_by_manager_id IS NOT NULL THEN 1 ELSE 0 END) as compliance_approved_count
        FROM visits
        WHERE company_id = $1 AND started_at >= $2 AND started_at <= $3
        GROUP BY rep_company_user_id
      ) v_counts ON v_counts.rep_company_user_id = cu.id
      LEFT JOIN (
        SELECT rep_company_user_id, SUM(amount) as expenses_sum
        FROM expenses
        WHERE company_id = $1 AND date >= $2 AND date <= $3
        GROUP BY rep_company_user_id
      ) e_counts ON e_counts.rep_company_user_id = cu.id
      LEFT JOIN (
        SELECT 
          rep_company_user_id, 
          SUM(walking_duration_ms) as walking_ms, 
          SUM(driving_duration_ms) as driving_ms, 
          SUM(still_duration_ms) as still_ms,
          SUM(total_distance_km) as distance_km
        FROM staff_activity_logs
        WHERE company_id = $1 AND date >= $2 AND date <= $3
        GROUP BY rep_company_user_id
      ) act ON act.rep_company_user_id = cu.id
      WHERE cu.company_id = $1 AND cu.role = 'rep' AND cu.status = 'active'
      ORDER BY total_sales DESC
    `;
        const res = await client.query(query, [cId, new Date('2020-01-01'), new Date('2030-01-01')]);
        console.log('Result length:', res.rows.length);
        console.log('Sample:', res.rows[0]);
    } catch (e) {
        console.error('QError:', e);
    } finally {
        await client.end();
    }
}

run();
