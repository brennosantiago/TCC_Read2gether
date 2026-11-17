import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import Button from '../components/Button';
import BookCard from '../components/BookCard';
import BookCover from '../components/BookCover';
import Card from '../components/Card';
import { useAppTheme, useThemedStyles } from '../hooks/useAppTheme';
import { searchGoogleBooks } from '../services/googleBooks';
import { createStyles } from '../styles/screens';

export default function BooksScreen({ books, setSelectedBookId, addBook }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPages, setNewBookPages] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  async function submitManualBook() {
    const added = await addBook({ title: newBookTitle, author: newBookAuthor, total: newBookPages });
    if (!added) return;
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookPages('');
    setIsAddingBook(false);
  }

  async function searchCatalog() {
    if (!query.trim()) {
      setSearchError('Digite um título, autor ou ISBN para buscar.');
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchError('');
    try {
      const results = await searchGoogleBooks(query, { maxResults: 8 });
      setSearchResults(results);
      if (results.length === 0) setSearchError('Não encontramos resultados. Tente outro título ou autor.');
    } catch (error) {
      setSearchError(error.message || 'Não foi possível acessar o Google Books. Tente novamente.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function addCatalogBook(volume) {
    if (!volume.pageCount) {
      Alert.alert('Total de páginas indisponível', 'Esse resultado não informa o total de páginas. Adicione o livro manualmente para preencher esse dado.');
      setIsAddingBook(true);
      setNewBookTitle(volume.title);
      setNewBookAuthor(volume.author === 'Autor não informado' ? '' : volume.author);
      return;
    }
    const wasAdded = await addBook({
      title: volume.title,
      author: volume.author,
      total: volume.pageCount,
      googleVolumeId: volume.googleVolumeId,
      thumbnail: volume.thumbnail,
      description: volume.description,
    });
    if (wasAdded) setSearchResults((current) => current.filter((item) => item.googleVolumeId !== volume.googleVolumeId));
  }

  return (
    <>
      <Text style={styles.eyebrow}>SUA ESTANTE PESSOAL</Text>
      <View style={styles.booksTitleRow}>
        <View><Text style={styles.pageTitle}>Meus livros</Text><Text style={styles.pageSubtitle}>{books.length} {books.length === 1 ? 'livro' : 'livros'} na sua estante</Text></View>
        <Pressable style={styles.addButton} onPress={() => setIsAddingBook((visible) => !visible)}><Text style={styles.addButtonText}>{isAddingBook ? '×' : '＋'}</Text></Pressable>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Encontrar um livro</Text>
        <Text style={styles.helperText}>Busque no catálogo do Google Books por título, autor ou ISBN.</Text>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={searchCatalog} placeholder="Digite um título, autor ou ISBN" placeholderTextColor="#AAA2B5" style={styles.formInput} returnKeyType="search" accessibilityLabel="Buscar livros no Google Books" />
        <Button onPress={searchCatalog} disabled={isSearching}>{isSearching ? 'Buscando…' : 'Buscar no Google Books'}</Button>
        {isSearching && <ActivityIndicator color={colors.purple} />}
        {!!searchError && <Text style={styles.searchError}>{searchError}</Text>}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((volume) => (
              <View key={volume.googleVolumeId} style={styles.searchResult}>
                <View style={styles.searchResultHeader}>
                  <BookCover title={volume.title} uri={volume.thumbnail} size="search" />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchTitle} numberOfLines={2}>{volume.title}{volume.subtitle ? `: ${volume.subtitle}` : ''}</Text>
                    <Text style={styles.searchMeta}>{volume.author} · {volume.pageCount ? `${volume.pageCount} páginas` : 'páginas não informadas'}</Text>
                    {!!volume.publishedDate && <Text style={styles.searchMeta}>Publicado em {volume.publishedDate}</Text>}
                  </View>
                </View>
                {!!volume.description && <Text numberOfLines={3} style={styles.searchDescription}>{volume.description}</Text>}
                <Button variant="outline" onPress={() => addCatalogBook(volume)}>{volume.pageCount ? 'Adicionar à estante' : 'Completar dados e adicionar'}</Button>
              </View>
            ))}
          </View>
        )}
      </Card>

      {isAddingBook && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Adicionar manualmente</Text>
          <Text style={styles.formLabel}>TÍTULO *</Text>
          <TextInput value={newBookTitle} onChangeText={setNewBookTitle} placeholder="Ex.: O Pequeno Príncipe" placeholderTextColor="#AAA2B5" style={styles.formInput} returnKeyType="next" />
          <Text style={styles.formLabel}>AUTOR (OPCIONAL)</Text>
          <TextInput value={newBookAuthor} onChangeText={setNewBookAuthor} placeholder="Nome do autor" placeholderTextColor="#AAA2B5" style={styles.formInput} returnKeyType="next" />
          <Text style={styles.formLabel}>TOTAL DE PÁGINAS</Text>
          <TextInput value={newBookPages} onChangeText={setNewBookPages} keyboardType="number-pad" placeholder="Ex.: 250" placeholderTextColor="#AAA2B5" style={styles.formInput} returnKeyType="done" />
          <Button onPress={submitManualBook}>Adicionar à estante</Button>
        </Card>
      )}

      <View style={styles.filterPill}><Text style={styles.filterPillText}>TODOS OS LIVROS</Text><Text style={styles.filterCount}>{books.length}</Text></View>
      {books.map((book) => <BookCard key={book.id} book={book} onPress={() => setSelectedBookId(book.id)} />)}
      <Button variant="outline" onPress={() => setIsAddingBook(true)}>＋  Adicionar livro manualmente</Button>
    </>
  );
}
