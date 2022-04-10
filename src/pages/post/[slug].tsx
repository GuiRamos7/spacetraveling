import Header from 'components/Header';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import styles from './post.module.scss';
import { minutesToHours } from 'date-fns';
import { formatData } from '../../utils/formatDate';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  function calculateReadingTime(content): string {
    const getHeadingWordsPerMinutes = content.reduce((acc, currentValue) => {
      return currentValue.heading.split(/\s+/).length + acc;
    }, 0);

    const getBodyWordsPerMinutes = content.reduce((acc, currentValue) => {
      return RichText.asText(currentValue.body).split(/\s+/).length + acc;
    }, 0);

    const getWordsPerMinutes = Math.ceil(
      (getHeadingWordsPerMinutes + getBodyWordsPerMinutes) / 200
    );

    if (getWordsPerMinutes < 1) {
      return 'Rápida leitura';
    }

    if (getWordsPerMinutes < 60) {
      return `${getWordsPerMinutes} min`;
    }

    return `${minutesToHours(getWordsPerMinutes)} horas`;
  }
  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>
      <main className={styles.container}>
        <img className={styles.banner} src={post.data.banner.url} />
        <article className={styles.content}>
          <h1>{post.data.title}</h1>

          <div className={styles.infos}>
            <time>
              <FiCalendar /> {formatData(post.first_publication_date)}
            </time>
            <span>
              <FiUser /> {post.data.author}
            </span>
            <time>
              <FiClock /> {calculateReadingTime(post.data.content)}
            </time>
          </div>

          {post.data.content.map(content => (
            <div
              key={content.heading.split(' ').join('-')}
              className={styles.postContent}
            >
              <h2>{content.heading}</h2>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['posts.slug'],
    }
  );

  const params = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      subtitle: response.data.subtitle,
      content: response.data.content.map(item => ({
        heading: item.heading,
        body: item.body,
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
