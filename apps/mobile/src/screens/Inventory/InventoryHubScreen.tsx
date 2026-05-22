import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { FontSize, FontWeight, Radius } from '../../constants/Theme';
import { rs, vs, ms } from '../../utils/responsive';
import {
  createSaleRecord,
  createStockRecord,
  digitalizeInventoryPhoto,
  digitalizeInventoryVoice,
  listInventoryTables,
  saveInventoryTable,
} from '../../services/api';
import { getAuthToken } from '../../services/storage';

const exampleTranscript = "J'ai vendu 3 maquereaux pour 2 000 francs.";
const speechLanguages = [
  { label: 'French', value: 'fr-FR' },
  { label: 'English', value: 'en-US' },
  { label: 'Pidgin', value: 'en-NG' },
];
type EditableTableRow = Record<string, string>;

export const InventoryHubScreen = () => {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(exampleTranscript);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [editableColumns, setEditableColumns] = useState<string[]>([]);
  const [editableRows, setEditableRows] = useState<EditableTableRow[]>([]);
  const [savingReviewedRows, setSavingReviewedRows] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [savedTables, setSavedTables] = useState<any[]>([]);
  const [loadingSavedTables, setLoadingSavedTables] = useState(false);
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const [showDetectedText, setShowDetectedText] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [speechLang, setSpeechLang] = useState('fr-FR');

  useEffect(() => {
    loadSavedTables();
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setRecognizing(true);
    startPulse();
  });

  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
    pulse.stopAnimation();
  });

  useSpeechRecognitionEvent('result', (event) => {
    const spokenText = event.results?.[0]?.transcript;
    if (spokenText) {
      setTranscript(spokenText);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setRecognizing(false);
    pulse.stopAnimation();
    Alert.alert('Speech recognition stopped', event.message || 'Please try speaking again.');
  });

  const startPulse = () => {
    pulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  };

  const getTokenOrWarn = async () => {
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return null;
    }
    return token;
  };

  const prepareEditableDraft = (data: any) => {
    const table = data?.structured_table;
    const tableColumns = Array.isArray(table?.columns) && table.columns.length > 0
      ? table.columns.map((column: any) => String(column))
      : fallbackColumns;
    const tableRows = Array.isArray(table?.rows) && table.rows.length > 0
      ? table.rows
      : buildFallbackRows(data?.items || []);

    setEditableColumns(tableColumns);
    setEditableRows(tableRows.map((row: Record<string, any>) => {
      const editableRow: EditableTableRow = {};
      tableColumns.forEach((column: string) => {
        editableRow[column] = String(row?.[column] ?? '');
      });
      return editableRow;
    }));
    setSavedMessage('');
  };

  const loadSavedTables = async () => {
    const token = await getAuthToken();
    if (!token) return;

    setLoadingSavedTables(true);
    const response = await listInventoryTables(token);
    setLoadingSavedTables(false);
    if (response.success) {
      setSavedTables(response.data || []);
    }
  };

  const captureInventoryPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to capture inventory photos.');
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.65,
      allowsEditing: false,
    });

    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    const uri = picked.assets[0].uri;
    setPhotoUri(uri);
    setLoadingPhoto(true);

    const token = await getTokenOrWarn();
    if (!token) {
      setLoadingPhoto(false);
      return;
    }

    const response = await digitalizeInventoryPhoto(token, uri, 'Daily inventory photo');
    setLoadingPhoto(false);

    if (!response.success) {
      Alert.alert('Inventory upload failed', response.error || 'Could not upload inventory photo.');
      return;
    }
    setResult(response.data);
    prepareEditableDraft(response.data);
  };

  const handleVoiceDigitalize = async () => {
    if (!transcript.trim()) {
      Alert.alert('Transcript needed', 'Enter or paste what the merchant said.');
      return;
    }

    setLoadingVoice(true);

    const token = await getTokenOrWarn();
    if (!token) {
      setLoadingVoice(false);
      return;
    }

    const response = await digitalizeInventoryVoice(token, transcript.trim(), 'auto');
    setLoadingVoice(false);

    if (!response.success) {
      Alert.alert('Voice note not saved', response.error || 'Could not digitalize this voice note.');
      return;
    }
    setResult(response.data);
    prepareEditableDraft(response.data);
  };

  const startSpeechRecognition = async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission needed', 'Allow speech recognition to capture voice inventory records.');
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: speechLang,
        interimResults: true,
        continuous: false,
      });
    } catch (error: any) {
      Alert.alert('Could not start speech', error?.message || 'Speech recognition is not available on this device.');
    }
  };

  const toggleSpeechRecognition = async () => {
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    await startSpeechRecognition();
  };

  const animatedScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const animatedOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  const items = result?.items || [];
  const sales = result?.sales_created || [];
  const stock = result?.stock_created || [];
  const structuredTable = result?.structured_table;
  const averageConfidence = items.length
    ? Math.round(items.reduce((total: number, item: any) => total + Number(item.confidence || 0), 0) / items.length)
    : 0;

  const formatMoney = (value: any) => {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount <= 0) return '-';
    return `${amount.toLocaleString()} FCFA`;
  };

  const formatQuantity = (value: any, unit?: string) => {
    const quantity = Number(value || 0);
    const cleanQuantity = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);
    return `${cleanQuantity} ${unit || 'unit'}`;
  };

  const itemTotal = (item: any) => Number(item.total_value ?? item.estimated_value ?? 0);
  const itemUnitPrice = (item: any) => {
    const explicit = Number(item.unit_price || 0);
    if (explicit > 0) return explicit;

    const total = itemTotal(item);
    const quantity = Number(item.quantity || 0);
    return total > 0 && quantity > 0 ? total / quantity : 0;
  };

  const cleanItemName = (item: any) => {
    const name = String(item.item_name || 'Inventory item');
    return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  };

  const itemCategory = (item: any) => {
    if (item.category) return item.category;
    const match = String(item.item_name || '').match(/\(([^)]+)\)\s*$/);
    return match?.[1] || 'Inventory';
  };

  const fallbackColumns = ['Product', 'Category', 'Qty', 'Unit price', 'Total', 'Status'];
  const buildFallbackRows = (sourceItems: any[]) => sourceItems.map((item: any) => ({
    Product: cleanItemName(item),
    Category: itemCategory(item),
    Qty: formatQuantity(item.quantity, item.unit),
    'Unit price': formatMoney(itemUnitPrice(item)),
    Total: formatMoney(itemTotal(item)),
    Status: item.action === 'sale' ? 'Sale' : item.action === 'stock' ? 'Stock' : 'Review',
  }));
  const tableColumns = editableColumns.length > 0 ? editableColumns : fallbackColumns;
  const tableRows = editableRows.length > 0 ? editableRows : buildFallbackRows(items);

  const updateCell = (rowIndex: number, column: string, value: string) => {
    setEditableRows((rows) => rows.map((row, index) => (
      index === rowIndex ? { ...row, [column]: value } : row
    )));
    setSavedMessage('');
  };

  const addRow = () => {
    const emptyRow: EditableTableRow = {};
    tableColumns.forEach((column) => {
      emptyRow[column] = '';
    });
    setEditableRows((rows) => [...rows, emptyRow]);
    setSavedMessage('');
  };

  const removeRow = (rowIndex: number) => {
    setEditableRows((rows) => rows.filter((_, index) => index !== rowIndex));
    setSavedMessage('');
  };

  const normalizeHeader = (value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const findColumn = (keywords: string[]) => tableColumns.find((column) => {
    const normalized = normalizeHeader(column);
    return keywords.some((keyword) => normalized.includes(keyword));
  });

  const getCell = (row: EditableTableRow, keywords: string[]) => {
    const column = findColumn(keywords);
    return column ? String(row[column] || '').trim() : '';
  };

  const parseNumber = (value: string) => {
    const cleaned = String(value || '')
      .replace(/[^\d,.\-\s]/g, '')
      .replace(/\s+/g, '')
      .trim();
    if (!cleaned) return 0;

    const normalized = cleaned.includes('.') && cleaned.includes(',')
      ? cleaned.replace(/,/g, '')
      : cleaned.replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const inferTableDate = () => {
    const dateColumn = findColumn(['date', 'jour']);
    const firstDateValue = dateColumn
      ? editableRows.map((row) => String(row[dateColumn] || '').trim()).find(Boolean)
      : '';
    if (firstDateValue) {
      const parsed = new Date(firstDateValue);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return new Date().toISOString();
  };

  const formatSavedTableDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'No date';
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const inferAction = (row: EditableTableRow) => {
    const headers = normalizeHeader(tableColumns.join(' '));
    const rowText = normalizeHeader(Object.values(row).join(' '));
    const firstItemAction = items[0]?.action;
    if (rowText.includes('sale') || rowText.includes('sold') || rowText.includes('vente') || rowText.includes('vendu')) return 'sale';
    if (rowText.includes('stock') || rowText.includes('purchase') || rowText.includes('achat') || rowText.includes('achete')) return 'stock';
    if (headers.includes('sales') || headers.includes('sold') || headers.includes('vente') || headers.includes('vendu') || firstItemAction === 'sale') return 'sale';
    return 'stock';
  };

  const inferProduct = (row: EditableTableRow) => {
    const namedCell = getCell(row, ['product', 'produit', 'item', 'article', 'name', 'nom', 'description']);
    if (namedCell) return namedCell;

    const firstTextColumn = tableColumns.find((column) => {
      const value = String(row[column] || '').trim();
      return value && !/^\d/.test(value) && !normalizeHeader(column).includes('date');
    });
    return firstTextColumn ? String(row[firstTextColumn] || '').trim() : '';
  };

  const saveReviewedTable = async () => {
    if (!editableRows.length) {
      Alert.alert('Nothing to save', 'There are no reviewed rows to save.');
      return;
    }

    const token = await getTokenOrWarn();
    if (!token) return;

    setSavingReviewedRows(true);
    let savedSales = 0;
    let savedStock = 0;
    let skippedRows = 0;

    for (const row of editableRows) {
      const product = inferProduct(row);
      const category = getCell(row, ['category', 'categorie', 'type']) || 'Inventory';
      const quantity = parseNumber(getCell(row, ['quantity', 'quantite', 'qty', 'qte', 'nombre', 'sold', 'vendu'])) || 1;
      const unitPrice = parseNumber(getCell(row, ['unit price', 'prix unitaire', 'unit cost', 'unite', 'price', 'prix', 'cost', 'cout']));
      const total = parseNumber(getCell(row, ['total sales', 'total', 'amount', 'montant', 'value', 'valeur', 'revenue', 'sales']));
      const amount = total || (unitPrice > 0 ? unitPrice * quantity : 0);
      const action = inferAction(row);

      if (!product || amount <= 0) {
        skippedRows += 1;
        continue;
      }

      if (action === 'sale') {
        const response = await createSaleRecord(token, {
          amount,
          payment_method: 'cash',
          item_note: `${quantity} ${product}`,
          category,
        });
        response.success ? savedSales += 1 : skippedRows += 1;
      } else {
        const response = await createStockRecord(token, {
          item_name: product,
          quantity,
          unit: 'unit',
          purchase_cost: amount,
          supplier: category,
        });
        response.success ? savedStock += 1 : skippedRows += 1;
      }
    }

    const tableResponse = await saveInventoryTable(token, {
      title: `Inventory - ${formatSavedTableDate(inferTableDate())}`,
      source: result?.source || 'reviewed',
      table_date: inferTableDate(),
      columns: tableColumns,
      rows: editableRows,
      raw_text: result?.extracted_text || result?.transcript,
      image_url: result?.image_url,
      linked_sales_count: savedSales,
      linked_stock_count: savedStock,
    });

    setSavingReviewedRows(false);
    if (tableResponse.success) {
      await loadSavedTables();
      setResult(null);
      setEditableColumns([]);
      setEditableRows([]);
      setPhotoUri(null);
      setShowDetectedText(false);
    }

    const tablePart = tableResponse.success ? ' The reviewed table was saved to inventory history.' : ' The rows were saved, but the table history could not be stored.';
    const message = `Saved ${savedSales} sale row${savedSales === 1 ? '' : 's'} and ${savedStock} stock row${savedStock === 1 ? '' : 's'}${skippedRows ? `. ${skippedRows} row${skippedRows === 1 ? '' : 's'} need more values.` : '.'}${tablePart}`;
    setSavedMessage(message);
    Alert.alert('Reviewed table saved', message);
  };

  const getColumnWidth = (column: string) => {
    const normalized = column.toLowerCase();
    if (normalized.includes('date')) return rs(82);
    if (normalized.includes('product') || normalized.includes('produit') || normalized.includes('item') || normalized.includes('article')) return rs(150);
    if (normalized.includes('supplier') || normalized.includes('vendor') || normalized.includes('company') || normalized.includes('fournisseur')) return rs(160);
    if (normalized.includes('category') || normalized.includes('categorie')) return rs(110);
    if (normalized.includes('quantity') || normalized.includes('quant') || normalized.includes('qty') || normalized.includes('qte')) return rs(88);
    if (normalized.includes('price') || normalized.includes('prix') || normalized.includes('cost') || normalized.includes('total') || normalized.includes('amount') || normalized.includes('montant')) return rs(126);
    return rs(116);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#042F24', '#0B6B53', '#10B981']}
        style={[styles.header, { paddingTop: insets.top + rs(14) }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoMark}>
            <Ionicons name="storefront" size={rs(18)} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>MboaTrust AI</Text>
        </View>
        <Text style={styles.title}>Smart Inventory</Text>
        <Text style={styles.subtitle}>
          Capture stock by photo or speak naturally. MboaTrust structures the data for your records.
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={captureInventoryPhoto} activeOpacity={0.85}>
            <LinearGradient colors={['#064E3B', '#059669']} style={styles.actionIcon}>
              <Ionicons name="camera-outline" size={rs(24)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionTitle}>Photo inventory</Text>
            <Text style={styles.actionText}>Take a photo of today's table, shelf, or baskets.</Text>
            <Text style={styles.actionCta}>{loadingPhoto ? 'Uploading...' : 'Capture photo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={toggleSpeechRecognition} activeOpacity={0.85}>
            <Animated.View style={[styles.voiceRing, { transform: [{ scale: animatedScale }], opacity: animatedOpacity }]}>
              <Ionicons name="mic-outline" size={rs(26)} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.actionTitle}>Speak records</Text>
            <Text style={styles.actionText}>Tap, speak naturally, then save the structured business record.</Text>
            <Text style={styles.actionCta}>{recognizing ? 'Stop listening' : 'Start speaking'}</Text>
          </TouchableOpacity>
        </View>

        {photoUri && (
          <View style={styles.previewCard}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>Inventory photo received</Text>
              <Text style={styles.previewText}>The image is saved with your account and prepared for structured review.</Text>
            </View>
          </View>
        )}

        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <Ionicons name="pulse-outline" size={rs(18)} color="#0B6B53" />
            <Text style={styles.sectionTitle}>Voice transcript</Text>
          </View>
          <TextInput
            style={styles.transcriptInput}
            value={transcript}
            onChangeText={setTranscript}
            multiline
            placeholder="Example: J'ai vendu 3 maquereaux pour 2 000 francs."
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.languagePills}>
            {speechLanguages.map((language) => (
              <TouchableOpacity
                key={language.value}
                style={[styles.langPill, speechLang === language.value && styles.langPillActive]}
                onPress={() => setSpeechLang(language.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, speechLang === language.value && styles.langTextActive]}>
                  {language.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.langPill}>
              <Text style={styles.langText}>Market noise</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.digitalizeBtn, loadingVoice && styles.digitalizeBtnDisabled]}
            onPress={handleVoiceDigitalize}
            activeOpacity={0.85}
            disabled={loadingVoice}
          >
            <Ionicons name="sparkles-outline" size={rs(16)} color="#FFFFFF" />
            <Text style={styles.digitalizeText}>{loadingVoice ? 'Digitalizing...' : 'Create editable draft'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.savedTablesCard}>
          <View style={styles.savedTablesHeader}>
            <View>
              <Text style={styles.sectionTitle}>Saved inventory tables</Text>
              <Text style={styles.savedTablesSub}>
                {loadingSavedTables ? 'Loading your tables...' : `${savedTables.length} table${savedTables.length === 1 ? '' : 's'} available for analysis`}
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshTablesBtn} onPress={loadSavedTables} activeOpacity={0.8}>
              <Ionicons name="refresh" size={rs(16)} color="#0B6B53" />
            </TouchableOpacity>
          </View>

          {savedTables.length === 0 ? (
            <View style={styles.emptySavedTableBox}>
              <Ionicons name="albums-outline" size={rs(19)} color="#0B6B53" />
              <Text style={styles.emptySavedTableText}>Saved reviewed tables will appear here by date.</Text>
            </View>
          ) : (
            savedTables.slice(0, 8).map((table) => {
              const isExpanded = expandedTableId === table.id;
              const columns = Array.isArray(table.columns) ? table.columns : [];
              const rows = Array.isArray(table.rows) ? table.rows : [];
              return (
                <View key={table.id} style={styles.savedTableItem}>
                  <TouchableOpacity
                    style={styles.savedTableSummary}
                    onPress={() => setExpandedTableId(isExpanded ? null : table.id)}
                    activeOpacity={0.84}
                  >
                    <View style={styles.savedTableIcon}>
                      <Ionicons name="grid-outline" size={rs(16)} color="#0B6B53" />
                    </View>
                    <View style={styles.savedTableCopy}>
                      <Text style={styles.savedTableTitle}>{table.title || 'Inventory table'}</Text>
                      <Text style={styles.savedTableMeta}>
                        {formatSavedTableDate(table.table_date)} | {table.row_count || rows.length} rows | {Number(table.total_value || 0).toLocaleString()} FCFA
                      </Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={rs(17)} color="#6B7280" />
                  </TouchableOpacity>

                  {isExpanded && columns.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedTableScroll}>
                      <View>
                        <View style={[styles.tableRow, styles.tableHeaderRow]}>
                          {columns.map((column: string) => (
                            <Text key={column} style={[styles.tableCell, styles.tableHeaderText, { width: getColumnWidth(column) }]} numberOfLines={2}>
                              {column}
                            </Text>
                          ))}
                        </View>
                        {rows.slice(0, 20).map((row: Record<string, any>, rowIndex: number) => (
                          <View key={`${table.id}-row-${rowIndex}`} style={styles.tableRow}>
                            {columns.map((column: string) => (
                              <Text key={`${table.id}-${rowIndex}-${column}`} style={[styles.tableCell, { width: getColumnWidth(column) }]} numberOfLines={3}>
                                {String(row[column] ?? '-')}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              );
            })
          )}
        </View>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="sparkles-outline" size={rs(19)} color="#B45309" />
              <Text style={styles.sectionTitle}>Structured AI output</Text>
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>

            {tableRows.length > 0 ? (
              <View style={styles.tableCard}>
                <View style={styles.reviewToolbar}>
                  <View style={styles.reviewCopy}>
                    <Text style={styles.reviewTitle}>Review before saving</Text>
                    <Text style={styles.reviewText}>Tap any cell to correct OCR or speech mistakes.</Text>
                  </View>
                  <TouchableOpacity style={styles.addRowBtn} onPress={addRow} activeOpacity={0.85}>
                    <Ionicons name="add" size={rs(16)} color="#0B6B53" />
                    <Text style={styles.addRowText}>Row</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      {tableColumns.map((column: string) => (
                        <Text
                          key={column}
                          style={[styles.tableCell, styles.tableHeaderText, { width: getColumnWidth(column) }]}
                          numberOfLines={2}
                        >
                          {column}
                        </Text>
                      ))}
                      <Text style={[styles.tableCell, styles.tableHeaderText, styles.tableActionCell]}>Edit</Text>
                    </View>
                    {tableRows.map((row: Record<string, any>, index: number) => (
                      <View key={`structured-row-${index}`} style={styles.tableRow}>
                        {tableColumns.map((column: string) => (
                          <TextInput
                            key={`${column}-${index}`}
                            style={[styles.tableInput, { width: getColumnWidth(column) }]}
                            value={String(row[column] ?? '')}
                            onChangeText={(value) => updateCell(index, column, value)}
                            multiline
                            placeholder="-"
                            placeholderTextColor="#9CA3AF"
                          />
                        ))}
                        <TouchableOpacity
                          style={styles.deleteRowBtn}
                          onPress={() => removeRow(index)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={rs(15)} color="#B91C1C" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {(structuredTable?.confidence || averageConfidence > 0) && (
                  <Text style={styles.confidenceNote}>
                    AI confidence: {Math.round(structuredTable?.confidence || averageConfidence)}%. Review before saving.
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.saveReviewedBtn, savingReviewedRows && styles.digitalizeBtnDisabled]}
                  onPress={saveReviewedTable}
                  disabled={savingReviewedRows}
                  activeOpacity={0.86}
                >
                  <Ionicons name="save-outline" size={rs(16)} color="#FFFFFF" />
                  <Text style={styles.saveReviewedText}>
                    {savingReviewedRows ? 'Saving reviewed table...' : 'Save reviewed table'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyStructuredBox}>
                <Ionicons name="document-text-outline" size={rs(18)} color="#B45309" />
                <Text style={styles.emptyStructuredText}>No structured rows yet. Try a clearer photo or use voice entry.</Text>
              </View>
            )}

            {result.extracted_text && (
              <View style={styles.detectedTextSection}>
                <TouchableOpacity
                  style={styles.detectedToggle}
                  onPress={() => setShowDetectedText((visible) => !visible)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={showDetectedText ? 'chevron-up' : 'chevron-down'} size={rs(16)} color="#92400E" />
                  <Text style={styles.detectedToggleText}>
                    {showDetectedText ? 'Hide raw OCR text' : 'Show raw OCR text'}
                  </Text>
                </TouchableOpacity>
                {showDetectedText && (
                  <View style={styles.extractedBox}>
                    <Text style={styles.extractedText}>{result.extracted_text}</Text>
                  </View>
                )}
              </View>
            )}

            {(savedMessage || sales.length > 0 || stock.length > 0) && (
              <View style={styles.savedBox}>
                <Ionicons name="checkmark-circle" size={rs(17)} color="#059669" />
                <Text style={styles.savedText}>
                  {savedMessage || `Saved ${sales.length} sale record${sales.length === 1 ? '' : 's'} and ${stock.length} stock record${stock.length === 1 ? '' : 's'}.`}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F2' },
  header: { paddingHorizontal: rs(20), paddingBottom: rs(24), borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(18) },
  logoMark: { width: rs(32), height: rs(32), borderRadius: rs(10), backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { color: '#FFFFFF', fontSize: ms(28), fontWeight: FontWeight.extrabold, marginBottom: rs(6) },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: FontSize.sm, lineHeight: rs(20), maxWidth: rs(320) },
  content: { padding: rs(16), paddingBottom: vs(110), gap: rs(14) },
  actionGrid: { flexDirection: 'row', gap: rs(12) },
  actionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), minHeight: rs(172), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  actionIcon: { width: rs(48), height: rs(48), borderRadius: rs(16), alignItems: 'center', justifyContent: 'center', marginBottom: rs(12) },
  voiceRing: { width: rs(48), height: rs(48), borderRadius: rs(24), alignItems: 'center', justifyContent: 'center', marginBottom: rs(12), backgroundColor: '#D97706' },
  actionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827', marginBottom: rs(5) },
  actionText: { fontSize: FontSize.xs, color: '#6B7280', lineHeight: rs(17), minHeight: rs(50) },
  actionCta: { marginTop: rs(8), color: '#0B6B53', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  previewCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(12), gap: rs(12), alignItems: 'center' },
  previewImage: { width: rs(76), height: rs(76), borderRadius: Radius.md, backgroundColor: '#E5E7EB' },
  previewCopy: { flex: 1 },
  previewTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#111827', marginBottom: rs(3) },
  previewText: { fontSize: FontSize.sm, color: '#6B7280', lineHeight: rs(18) },
  voiceCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), gap: rs(10) },
  voiceHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(7) },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#111827' },
  transcriptInput: { minHeight: rs(92), borderWidth: 1.5, borderColor: '#D1EAE0', borderRadius: Radius.lg, padding: rs(12), textAlignVertical: 'top', fontSize: FontSize.base, color: '#111827', backgroundColor: '#FAFCFB' },
  languagePills: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(7) },
  langPill: { backgroundColor: '#ECFDF5', paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: Radius.full },
  langPillActive: { backgroundColor: '#0B6B53' },
  langText: { fontSize: FontSize.xs, color: '#0B6B53', fontWeight: FontWeight.semibold },
  langTextActive: { color: '#FFFFFF' },
  digitalizeBtn: { marginTop: rs(4), height: rs(46), borderRadius: Radius.full, backgroundColor: '#0B6B53', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8) },
  digitalizeBtnDisabled: { opacity: 0.65 },
  digitalizeText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  savedTablesCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), gap: rs(10) },
  savedTablesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(10) },
  savedTablesSub: { marginTop: rs(3), fontSize: FontSize.xs, color: '#6B7280' },
  refreshTablesBtn: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  emptySavedTableBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: '#F0FDF4', borderRadius: Radius.md, padding: rs(10), borderWidth: 1, borderColor: '#D1EAE0' },
  emptySavedTableText: { flex: 1, fontSize: FontSize.sm, color: '#0B6B53', lineHeight: rs(18) },
  savedTableItem: { borderWidth: 1, borderColor: '#EEF2F0', borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  savedTableSummary: { flexDirection: 'row', alignItems: 'center', gap: rs(10), padding: rs(10) },
  savedTableIcon: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  savedTableCopy: { flex: 1 },
  savedTableTitle: { fontSize: FontSize.sm, color: '#111827', fontWeight: FontWeight.bold },
  savedTableMeta: { marginTop: rs(2), fontSize: FontSize.xs, color: '#6B7280' },
  savedTableScroll: { borderTopWidth: 1, borderTopColor: '#EEF2F0' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: rs(14), gap: rs(10), borderWidth: 1, borderColor: '#FDE68A' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(7) },
  resultMessage: { fontSize: FontSize.sm, color: '#6B7280', lineHeight: rs(19) },
  tableCard: { borderWidth: 1, borderColor: '#D1EAE0', borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  reviewToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(10), padding: rs(10), borderBottomWidth: 1, borderBottomColor: '#EEF2F0', backgroundColor: '#FAFCFB' },
  reviewCopy: { flex: 1 },
  reviewTitle: { fontSize: FontSize.sm, color: '#111827', fontWeight: FontWeight.bold },
  reviewText: { marginTop: rs(2), fontSize: FontSize.xs, color: '#6B7280' },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingHorizontal: rs(10), paddingVertical: rs(7), borderRadius: Radius.full, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1EAE0' },
  addRowText: { color: '#0B6B53', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  tableScroll: { maxWidth: '100%' },
  tableRow: { flexDirection: 'row', minHeight: rs(46), borderBottomWidth: 1, borderBottomColor: '#EEF2F0', alignItems: 'center' },
  tableHeaderRow: { minHeight: rs(38), backgroundColor: '#ECFDF5' },
  tableHeaderText: { color: '#065F46', fontWeight: FontWeight.bold, fontSize: FontSize.xs },
  tableCell: { paddingHorizontal: rs(8), paddingVertical: rs(7), fontSize: FontSize.xs, color: '#1F2937' },
  tableInput: { minHeight: rs(46), paddingHorizontal: rs(8), paddingVertical: rs(7), fontSize: FontSize.xs, color: '#1F2937', borderRightWidth: 1, borderRightColor: '#F3F4F6', textAlignVertical: 'center' },
  tableActionCell: { width: rs(54), textAlign: 'center' },
  deleteRowBtn: { width: rs(54), minHeight: rs(46), alignItems: 'center', justifyContent: 'center' },
  saveReviewedBtn: { margin: rs(10), height: rs(44), borderRadius: Radius.full, backgroundColor: '#0B6B53', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8) },
  saveReviewedText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  dateCell: { width: rs(78) },
  productCell: { width: rs(148), fontWeight: FontWeight.semibold },
  categoryCell: { width: rs(104) },
  qtyCell: { width: rs(76), textAlign: 'right' },
  moneyCell: { width: rs(112), textAlign: 'right' },
  statusCell: { width: rs(78), color: '#B45309', fontWeight: FontWeight.semibold, textAlign: 'center' },
  confidenceNote: { padding: rs(9), fontSize: FontSize.xs, color: '#6B7280', backgroundColor: '#FAFCFB' },
  emptyStructuredBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: '#FFFBEB', borderRadius: Radius.md, padding: rs(10), borderWidth: 1, borderColor: '#FDE68A' },
  emptyStructuredText: { flex: 1, fontSize: FontSize.sm, color: '#92400E', lineHeight: rs(18) },
  detectedTextSection: { gap: rs(8) },
  detectedToggle: { flexDirection: 'row', alignItems: 'center', gap: rs(6), alignSelf: 'flex-start', paddingVertical: rs(5) },
  detectedToggleText: { fontSize: FontSize.xs, color: '#92400E', fontWeight: FontWeight.bold },
  extractedBox: { backgroundColor: '#FFFBEB', borderRadius: Radius.md, padding: rs(10), borderWidth: 1, borderColor: '#FDE68A' },
  extractedLabel: { fontSize: FontSize.xs, color: '#92400E', fontWeight: FontWeight.bold, marginBottom: rs(4) },
  extractedText: { fontSize: FontSize.xs, color: '#78350F', lineHeight: rs(17) },
  structuredRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingVertical: rs(10), borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  itemIcon: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#111827', textTransform: 'capitalize' },
  itemMeta: { fontSize: FontSize.xs, color: '#6B7280', marginTop: rs(2) },
  confidence: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#B45309' },
  savedBox: { flexDirection: 'row', alignItems: 'center', gap: rs(7), backgroundColor: '#ECFDF5', padding: rs(10), borderRadius: Radius.md },
  savedText: { flex: 1, fontSize: FontSize.sm, color: '#065F46', fontWeight: FontWeight.semibold },
});
