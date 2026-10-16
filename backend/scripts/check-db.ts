import prisma from '../api/config/database';

async function main() {
    const [analyzers, samples, orders, users, scenarios, runs, proposals, modelProfiles, policies, surgeRules] = await Promise.all([
        prisma.analyzer.count(),
        prisma.sample.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.digitalTwinScenario.count(),
        prisma.digitalTwinSimulationRun.count(),
        prisma.analyzerFailoverProposal.count(),
        prisma.digitalTwinModelProfile.count(),
        prisma.digitalTwinOperatingPolicy.count(),
        prisma.digitalTwinSurgeRule.count(),
    ]);

    console.log('=== LABCORE DATABASE HEALTH & COUNTS ===');
    console.log({
        analyzers,
        samples,
        orders,
        users,
        scenarios,
        runs,
        proposals,
        modelProfiles,
        policies,
        surgeRules,
    });
}

main()
    .catch((err) => {
        console.error('DB Error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
