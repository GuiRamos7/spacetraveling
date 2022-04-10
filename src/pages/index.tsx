import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { FiUser, FiCalendar } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [page, setPage] = useState<string | null>(postsPagination.next_page);

  const formatData = (date: string) => {
    const newDate = new Date(date);

    return format(newDate, 'dd LLL yyy', {
      locale: ptBR,
    });
  };

  async function handleSeeMore(): Promise<void> {
    try {
      const response = await fetch(page);
      const data = await response.json();

      setPage(data.next_page);

      const posts: Post[] = data.results.map(
        post =>
          ({
            uid: post.uid,
            data: {
              author: post.data.author,
              title: post.data.title,
              subtitle: post.data.subtitle,
            },
            first_publication_date: post.first_publication_date,
          } as Post)
      );

      setPosts(prevState => [...prevState, ...posts]);
    } catch (err) {
      throw new Error(err);
    }
  }

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.posts}></div>
        {posts.map(el => (
          <div key={el.uid} className={styles.post}>
            <div>
              <Link href={`/post/${el.uid}`}>
                <h1>{el.data.title}</h1>
              </Link>
              <span>{el.data.subtitle}</span>
            </div>
            <div>
              <time>
                <FiCalendar /> {formatData(el.first_publication_date)}
              </time>
              <span>
                <FiUser /> {el.data.author}
              </span>
            </div>
          </div>
        ))}

        {page && (
          <button className={styles.loadMoreButton} onClick={handleSeeMore}>
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 1, fetch: ['post.title', 'post.subtitle', 'post.author'] }
  );

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
    first_publication_date: post.first_publication_date,
  }));

  return {
    revalidate: 60 * 60 * 24, // 1 day
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
