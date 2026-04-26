import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import prisma from "../../lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import MyJobsClient from "./MyJobsClient";

export default async function MeusTramposPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <div className={styles.container}>
        <div className={styles.denied}>
          <h2>Acesso Negado</h2>
          <p>Faça login para ver suas publicações.</p>
        </div>
      </div>
    );
  }

  const jobs = await prisma.jobPost.findMany({
    where: { discordId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Meus <span>Trampos</span></h1>
        <p className={styles.subtitle}>Gerencie suas vagas e perfis publicados.</p>
        <Link href="/" className={styles.backBtn}>← Voltar</Link>
      </div>
      <MyJobsClient initialJobs={jobs} />
    </div>
  );
}
